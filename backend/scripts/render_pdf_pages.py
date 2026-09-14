"""Страницы PDF для просмотра на сайте (К-08): один файл или добор всех.

Один файл — так его запускает API после сохранения конгресса:

    python -m scripts.render_pdf_pages uploads/<uuid>.pdf

Добор — все PDF программ и положений конкурса из БД (только /uploads/*.pdf),
у которых ещё нет готового манифеста. Каждый файл рисуется отдельным
процессом с жёстким тайм-аутом; сбой одного файла попадает в отчёт, прогон
продолжается (код выхода 1). В прод-контейнере (cwd /app):

    python -m scripts.render_pdf_pages --backfill

Одновременно рисуется один PDF (flock на файле-замке во временном каталоге
системы — не в uploads/, его отдаёт nginx; на Windows без замка, это только
разработка). Процесс рисования одного файла на Linux ограничен: RLIMIT_CPU
(SIGXCPU обрывает и тяжёлую страницу внутри PDFium, а сон в очереди на замке
не считается), RLIMIT_AS, без core-файлов, nice 10 — сайт и Postgres на
1 vCPU важнее.
"""
import argparse
import asyncio
import contextlib
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

import pdf_pages  # noqa: E402

try:
    import fcntl
except ImportError:  # Windows
    fcntl = None

# Оба воркера uvicorn живут в одном контейнере — общий временный каталог им общий
LOCK_PATH = Path(tempfile.gettempdir()) / "rheum-render-pdf-pages.lock"
MEMORY_LIMIT = 1536 * 1024 * 1024  # 1,5 ГБ адресного пространства на процесс рисования
CPU_LIMIT = pdf_pages.RENDER_TIMEOUT + 30  # мягкий предел, секунд процессора; жёсткий — на 10 выше
NICE = 10
PROCESS_TIMEOUT = pdf_pages.PROCESS_TIMEOUT  # у родителя — только последняя страховка
FILE_FIELDS = tuple(
    f"{kind}_file_{lang}" for kind in ("program", "young_scientists") for lang in ("ru", "uz", "en")
)


@contextlib.contextmanager
def _render_lock():
    if fcntl is None:
        yield
        return
    with open(LOCK_PATH, "a") as lock_file:
        fcntl.flock(lock_file, fcntl.LOCK_EX)  # снимается при закрытии файла или смерти процесса
        yield


def _limit_resources() -> None:
    """Пределы процесса рисования одного файла. Ставятся только при запуске
    из командной строки: пределы не поднять обратно, в main() по умолчанию
    они ограничили бы сам pytest."""
    if sys.platform.startswith("linux"):
        import resource

        resource.setrlimit(resource.RLIMIT_AS, (MEMORY_LIMIT, MEMORY_LIMIT))
        # SIGXCPU по умолчанию убивает процесс — и посреди страницы в PDFium;
        # родитель по коду -SIGXCPU пишет error.json «timeout»
        resource.setrlimit(resource.RLIMIT_CPU, (CPU_LIMIT, CPU_LIMIT + 10))
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    if hasattr(os, "nice"):
        os.nice(NICE)


def render_one(path: Path, uploads_dir: Path) -> int:
    try:
        pdf = pdf_pages.resolve_upload(path, uploads_dir)
    except (ValueError, FileNotFoundError) as exc:
        print(f"ОШИБКА {path.name}: {exc}")
        return 1
    manifest = pdf_pages.read_manifest(pdf)
    if manifest is not None:
        print(f"{pdf.name}: страницы уже есть — {manifest['rendered']} стр.")
        return 0

    with _render_lock():
        started = time.monotonic()
        try:
            manifest = pdf_pages.render(pdf, uploads_dir)
        except pdf_pages.PdfPagesError as exc:
            print(f"ОШИБКА {pdf.name}: {exc.message} ({exc.code})")
            return 1
    note = f", показаны первые {manifest['rendered']} из {manifest['page_count']}" if manifest["truncated"] else ""
    print(f"{pdf.name}: готово — {manifest['rendered']} стр. за {time.monotonic() - started:.1f} с{note}")
    return 0


async def _file_urls() -> list:
    """Ссылки на PDF программ и положений всех конгрессов. Свой движок без
    echo: движок приложения печатает каждый запрос и засорил бы отчёт."""
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import create_async_engine

    from config import settings
    from database.models import Congress

    engine = create_async_engine(settings.DATABASE_URL)
    try:
        async with engine.connect() as conn:
            rows = (await conn.execute(select(*(getattr(Congress, name) for name in FILE_FIELDS)))).all()
    finally:
        await engine.dispose()
    return [url for row in rows for url in row if url]


def _render_in_child(pdf: Path, uploads_dir: Path) -> bool:
    """Один файл в отдельном процессе: падение или зависание PDFium не
    обрывает весь добор, память освобождается после каждого файла."""
    try:
        result = subprocess.run(
            [sys.executable, "-m", "scripts.render_pdf_pages", str(pdf), "--uploads-dir", str(uploads_dir)],
            cwd=BACKEND_DIR,
            env={**os.environ, "PYTHONIOENCODING": "utf-8"},
            capture_output=True,
            encoding="utf-8",
            errors="replace",
            timeout=PROCESS_TIMEOUT,
        )
    except subprocess.TimeoutExpired:
        pdf_pages.mark_failed_run(pdf, timed_out=True)
        print(f"ОШИБКА {pdf.name}: процесс рисования убит через {PROCESS_TIMEOUT} с")
        return False
    output = (result.stdout + result.stderr).strip()
    if output:
        print(output)
    if result.returncode != 0:
        written = pdf_pages.mark_failed_run(pdf, returncode=result.returncode)
        if written or not output:
            print(f"ОШИБКА {pdf.name}: процесс рисования завершился с кодом {result.returncode}"
                  + (f", записано {written}" if written else ""))
    return result.returncode == 0


def backfill(uploads_dir: Path) -> int:
    removed = pdf_pages.remove_stale_tmp_dirs(uploads_dir)
    if removed:
        print(f"Удалено осиротевших временных каталогов: {removed}")
    paths = []
    for url in asyncio.run(_file_urls()):
        path = pdf_pages.upload_url_to_path(url, uploads_dir)
        if path is not None and path not in paths:
            paths.append(path)
    todo = [path for path in paths if pdf_pages.read_manifest(path) is None]
    done_before = len(paths) - len(todo)
    print(f"PDF в конгрессах: {len(paths)}, уже готовы: {done_before}, рисуем: {len(todo)}")

    rendered = errors = 0
    for path in todo:
        if _render_in_child(path, uploads_dir):
            rendered += 1
        else:
            errors += 1
    print(f"ИТОГО: готово {rendered}, ошибок {errors}, уже были готовы {done_before}")
    return 1 if errors else 0


def main(argv=None, *, limit_resources: bool = False) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("path", nargs="?", type=Path, help="PDF в каталоге загрузок")
    parser.add_argument("--backfill", action="store_true", help="дорисовать все PDF конгрессов из БД")
    parser.add_argument(
        "--uploads-dir", type=Path, default=Path("uploads"),
        help="каталог загрузок (по умолчанию uploads/ от текущего каталога, как у приложения)",
    )
    args = parser.parse_args(argv)
    if (args.path is None) == (not args.backfill):
        parser.error("укажите путь к PDF или --backfill (что-то одно)")
    if not args.uploads_dir.is_dir():
        parser.error(f"каталог загрузок не найден: {args.uploads_dir}")

    uploads_dir = args.uploads_dir.resolve()
    if args.backfill:
        return backfill(uploads_dir)  # оркестратор сам не рисует — пределы у дочерних процессов
    if limit_resources:
        _limit_resources()
    return render_one(args.path, uploads_dir)


if __name__ == "__main__":
    sys.exit(main(limit_resources=True))
