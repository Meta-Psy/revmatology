"""Страницы PDF как картинки для быстрого просмотра на телефонах (К-08).

Договор с фронтом (design-doc К-08, §4). Для /uploads/<name>.pdf рядом с ним:

    <name>.pages/manifest.json      появляется последним — вместе с каталогом
    <name>.pages/p<N>-800.webp      N = 1..rendered
    <name>.pages/p<N>-1600.webp
    <name>.pages.error.json         только при неудаче

Чистая логика, без FastAPI. PDFium нельзя вызывать из нескольких потоков
(документация pypdfium2), поэтому render() зовётся только из отдельного
процесса — scripts/render_pdf_pages.py — и никогда из воркера uvicorn.
pypdfium2 импортируется внутри рисования: веб-процесс берёт отсюда только
пути, чтобы библиотека не загружалась в него вовсе.
"""
import glob
import json
import logging
import os
import re
import shutil
import signal
import tempfile
import time
from pathlib import Path
from typing import Optional

from PIL import Image

logger = logging.getLogger(__name__)

MANIFEST_VERSION = 1
MAX_PAGES = 60
WIDTHS = (800, 1600)  # по возрастанию; размеры страниц в манифесте — от последней
# WebP не бывает больше 16383 px по стороне: очень длинную страницу сужаем
MAX_SIDE = 16000
WEBP_QUALITY = 75
WEBP_METHOD = 2  # в 2,1 раза быстрее method 4 при +2,6 % объёма (замер К-08) — важно на 1 vCPU
# Секунд рисования на файл, считая с получения замка. Между страницами —
# мягкий дедлайн (публикуется нарисованное), внутри страницы — RLIMIT_CPU
# процесса рисования (scripts/render_pdf_pages.py).
RENDER_TIMEOUT = 180
# Тайм-аут родителя (API, --backfill) — последняя страховка: процесс может
# долго стоять в очереди на замке, а время рисования ограничивает себе сам.
PROCESS_TIMEOUT = 45 * 60
# Каталоги .<name>.pages.tmp-* старше этого — остатки убитых процессов
STALE_TMP_AGE = 3600
# Ошибки, которые повторное рисование не исправит
FINAL_ERRORS = {"encrypted", "corrupt", "empty"}
SIGXCPU = getattr(signal, "SIGXCPU", 24)  # на Windows сигнала нет; 24 — значение Linux

ERROR_MESSAGES = {
    "encrypted": "Файл защищён паролем",
    "corrupt": "Файл повреждён или не является PDF",
    "empty": "В документе нет страниц",
    "timeout": f"Страницы не успели подготовиться за {RENDER_TIMEOUT} с — документ слишком тяжёлый",
    "internal": "Внутренняя ошибка при подготовке страниц",
}

# Имя — как isOwnPdf на фронте (/^\/uploads\/[A-Za-z0-9._-]+\.pdf$/): что фронт
# не покажет страницами, то и рисовать незачем. \Z, а не $: $ пропускает
# завершающий перевод строки.
_NAME = r"[A-Za-z0-9._-]+"
_UPLOAD_URL = re.compile(rf"^/uploads/({_NAME})\.pdf\Z")
_PDF_NAME = re.compile(rf"{_NAME}\.pdf\Z")
_clock = time.monotonic  # подменяется в тестах


class PdfPagesError(Exception):
    """Документ не нарисован; error.json рядом с PDF уже записан."""

    def __init__(self, code: str):
        self.code = code
        self.message = ERROR_MESSAGES[code]
        super().__init__(f"{code}: {self.message}")


def pages_dir(pdf: Path) -> Path:
    return pdf.with_name(f"{pdf.stem}.pages")


def error_path(pdf: Path) -> Path:
    return pdf.with_name(f"{pdf.stem}.pages.error.json")


def upload_url_to_path(url: Optional[str], uploads_dir: Path) -> Optional[Path]:
    """/uploads/<name>.pdf → <uploads_dir>/<name>.pdf; всё прочее (внешние
    ссылки, другие расширения, подкаталоги, «..») → None."""
    match = _UPLOAD_URL.match(url or "")
    if not match or match.group(1) in (".", ".."):
        return None
    return Path(uploads_dir) / f"{match.group(1)}.pdf"


def resolve_upload(pdf_path, uploads_dir) -> Path:
    """Нормализованный путь PDF, лежащего прямо в каталоге загрузок.

    ValueError — вне каталога или не .pdf (ничего не пишем: писать пришлось бы
    рядом с чужим файлом); FileNotFoundError — файла нет.
    """
    uploads = Path(uploads_dir).resolve()
    pdf = Path(pdf_path).resolve()  # resolve раскрывает и «..», и символические ссылки
    if pdf.parent != uploads:
        raise ValueError(f"файл вне каталога загрузок {uploads}: {pdf}")
    if not _PDF_NAME.match(pdf.name) or pdf.stem in ("", ".", ".."):
        raise ValueError(f"не PDF или недопустимое имя: {pdf.name!r}")
    if not pdf.is_file():
        raise FileNotFoundError(f"файл не найден: {pdf}")
    return pdf


def read_manifest(pdf: Path) -> Optional[dict]:
    """Готовый манифест или None, если его нет или он неполный."""
    directory = pages_dir(pdf)
    try:
        manifest = json.loads((directory / "manifest.json").read_text(encoding="utf-8"))
        pages = manifest["pages"]
        ok = (
            manifest["version"] == MANIFEST_VERSION
            and manifest["source"] == pdf.name
            and manifest["rendered"] == len(pages)
            and all(
                (directory / f"p{page['n']}-{width}.webp").is_file()
                for page in pages
                for width in manifest["widths"]
            )
        )
    except (OSError, ValueError, KeyError, TypeError):
        return None
    return manifest if ok else None


def render(pdf_path, uploads_dir, *, timeout: Optional[float] = None) -> dict:
    """Нарисовать страницы PDF и вернуть манифест.

    Уже есть готовый манифест — ничего не делает (имена загрузок — UUID, файл
    не меняется). Пишет во временный каталог рядом и переименовывает его
    целиком, так что каталог страниц появляется сразу с манифестом. Время
    вышло между страницами — публикуется нарисованное (truncated). Ошибка
    документа → <name>.pages.error.json и PdfPagesError; частичного каталога
    не остаётся.
    """
    if timeout is None:
        timeout = RENDER_TIMEOUT
    pdf = resolve_upload(pdf_path, uploads_dir)
    manifest = read_manifest(pdf)
    if manifest is not None:
        return manifest

    target = pages_dir(pdf)
    _remove_leftovers(pdf)
    tmp = Path(tempfile.mkdtemp(dir=pdf.parent, prefix=f".{target.name}.tmp-"))
    try:
        os.chmod(tmp, 0o755)  # mkdtemp даёт 0700 — nginx (другой пользователь) не прочитал бы
        try:
            manifest = _render_into(pdf, tmp, _clock() + timeout)
        except PdfPagesError:
            raise
        except Exception as exc:
            logger.exception("Сбой рисования страниц %s", pdf.name)
            raise PdfPagesError("internal") from exc
        _write_json(tmp / "manifest.json", manifest)  # последним
        os.replace(tmp, target)
    except PdfPagesError as exc:
        shutil.rmtree(tmp, ignore_errors=True)
        write_error(pdf, exc.code)
        raise
    except BaseException:
        shutil.rmtree(tmp, ignore_errors=True)
        raise
    error_path(pdf).unlink(missing_ok=True)
    return manifest


def write_error(pdf: Path, code: str) -> None:
    _write_json(error_path(pdf), {
        "version": MANIFEST_VERSION, "source": pdf.name, "error": code, "message": ERROR_MESSAGES[code],
    })


def _error_code(pdf: Path) -> Optional[str]:
    try:
        return json.loads(error_path(pdf).read_text(encoding="utf-8")).get("error")
    except (OSError, ValueError, AttributeError):
        return None


def needs_render(pdf: Path) -> bool:
    """Стоит ли запускать рисование: файл есть, страниц нет, и прошлая
    неудача (если была) не окончательная — internal/timeout или непонятный
    error.json. Защищённый паролем, битый или пустой PDF заново не рисуем."""
    if not pdf.is_file() or read_manifest(pdf) is not None:
        return False
    return _error_code(pdf) not in FINAL_ERRORS


def mark_failed_run(pdf: Path, *, returncode: Optional[int] = None, timed_out: bool = False) -> Optional[str]:
    """Для родителя процесса рисования (API, --backfill): процесс кончился
    неудачей и не оставил ни манифеста, ни error.json (убит сигналом, по
    памяти, собственным тайм-аутом родителя) — пишем error.json сами, иначе
    админ вечно видит «Готовятся…». Возвращает записанный код или None."""
    if not timed_out and returncode == 0:
        return None
    if not pdf.is_file() or read_manifest(pdf) is not None or error_path(pdf).exists():
        return None
    code = "timeout" if timed_out or returncode == -SIGXCPU else "internal"
    write_error(pdf, code)
    return code


def remove_stale_tmp_dirs(uploads_dir: Path, *, older_than: float = STALE_TMP_AGE) -> int:
    """Удаляет .<name>.pages.tmp-* старше older_than секунд — остатки
    процессов, убитых посреди рисования. Свежие не трогает: их, возможно,
    прямо сейчас пишет живой процесс."""
    removed = 0
    border = time.time() - older_than
    for leftover in Path(uploads_dir).glob(".*.pages.tmp-*"):
        try:
            if leftover.is_dir() and leftover.stat().st_mtime < border:
                shutil.rmtree(leftover)
                removed += 1
        except OSError:
            logger.warning("Не удалось удалить %s", leftover, exc_info=True)
    return removed


def _remove_leftovers(pdf: Path) -> None:
    """Временные каталоги убитых прогонов и каталог страниц без годного манифеста."""
    target = pages_dir(pdf)
    for leftover in pdf.parent.glob(f".{glob.escape(target.name)}.tmp-*"):
        shutil.rmtree(leftover, ignore_errors=True)
    if target.exists():
        shutil.rmtree(target)


def _render_into(pdf: Path, directory: Path, deadline: float) -> dict:
    import pypdfium2 as pdfium

    data = pdf.read_bytes()
    if not data:
        raise PdfPagesError("empty")
    try:
        doc = pdfium.PdfDocument(data)
    except pdfium.PdfiumError as exc:
        raise PdfPagesError(_load_error_code(pdfium, exc.err_code)) from exc
    try:
        page_count = len(doc)
        if page_count == 0:
            raise PdfPagesError("empty")
        doc.init_forms()  # иначе заполненные поля форм не рисуются
        pages = []
        for index in range(min(page_count, MAX_PAGES)):
            if _clock() >= deadline:
                if not pages:
                    raise PdfPagesError("timeout")
                # нарисованное не выбрасываем: фронт покажет «первые N из M»
                logger.warning("Страницы %s: время вышло, опубликовано %d из %d", pdf.name, len(pages), page_count)
                break
            page = doc[index]
            try:
                width, height = _render_page(page, directory, index + 1)
            finally:
                page.close()
            pages.append({"n": index + 1, "w": width, "h": height})
        rendered = len(pages)
        outline = _outline(doc, rendered)
    except pdfium.PdfiumError as exc:
        raise PdfPagesError("corrupt") from exc
    finally:
        doc.close()
    return {
        "version": MANIFEST_VERSION,
        "source": pdf.name,
        "page_count": page_count,
        "rendered": rendered,
        "truncated": page_count > rendered,
        "widths": list(WIDTHS),
        "pages": pages,
        "outline": outline,
    }


def _load_error_code(pdfium, err_code) -> str:
    raw = pdfium.raw
    if err_code in (raw.FPDF_ERR_PASSWORD, raw.FPDF_ERR_SECURITY):
        return "encrypted"
    if err_code == raw.FPDF_ERR_SUCCESS:
        # Так PDFium отказывается открывать синтаксически целый документ без
        # страниц: код ошибки он не ставит, и pypdfium2 читает прошлый. Он
        # чистый только в свежем процессе — поэтому каждый файл и рисуется
        # отдельным процессом; при повторных вызовах в одном процессе (на
        # Linux) пустой документ может прийти как corrupt.
        return "empty"
    return "corrupt"


def _render_page(page, directory: Path, n: int) -> tuple:
    """Рисует страницу во всех ширинах; возвращает размер самой большой версии."""
    width_pt, height_pt = page.get_size()
    scale = min(WIDTHS[-1] / width_pt, MAX_SIDE / height_pt)
    size = (max(1, round(width_pt * scale)), max(1, round(height_pt * scale)))
    image = page.render(scale=scale).to_pil()
    if image.size != size:  # pypdfium2 округляет вверх — бывает лишний пиксель
        image = image.resize(size, Image.LANCZOS)
    for width in WIDTHS:
        ratio = width / WIDTHS[-1]
        version = image if ratio == 1 else image.resize(
            (max(1, round(size[0] * ratio)), max(1, round(size[1] * ratio))), Image.LANCZOS
        )
        version.save(directory / f"p{n}-{width}.webp", "WEBP", quality=WEBP_QUALITY, method=WEBP_METHOD)
    return size


def _outline(doc, rendered: int) -> list:
    """Закладки PDF деревом; page — с 1. Пункт без ссылки или со ссылкой за
    пределы нарисованных страниц выпадает, его годные дети встают на его место."""
    root = {"children": []}
    stack = [(-1, root)]
    for bookmark in doc.get_toc():
        dest = bookmark.get_dest()
        index = dest.get_index() if dest is not None else None
        node = {
            "title": (bookmark.get_title() or "").strip(),
            "page": index + 1 if index is not None else None,
            "children": [],
        }
        while stack[-1][0] >= bookmark.level:
            stack.pop()
        stack[-1][1]["children"].append(node)
        stack.append((bookmark.level, node))
    return _prune(root["children"], rendered, 0)


def _prune(nodes: list, rendered: int, level: int) -> list:
    result = []
    for node in nodes:
        page = node["page"]
        if page is not None and 1 <= page <= rendered:
            result.append({
                "title": node["title"],
                "page": page,
                "level": level,
                "children": _prune(node["children"], rendered, level + 1),
            })
        else:
            result.extend(_prune(node["children"], rendered, level))
    return result


def _write_json(path: Path, data: dict) -> None:
    """Атомарно: временный файл рядом и os.replace."""
    fd, tmp_name = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
        os.chmod(tmp_name, 0o644)  # mkstemp даёт 0600 — nginx не прочитал бы
        os.replace(tmp_name, path)
    except BaseException:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)
        raise
