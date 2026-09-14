"""Пережатие уже загруженных изображений НА МЕСТЕ.

Имя и формат файла сохраняются, поэтому ссылки в БД остаются рабочими:
поворот по EXIF, EXIF/GPS удаляются, длинная сторона не больше 1600 px,
JPEG q85 / PNG optimize / WEBP q85. Если результат не меньше исходника —
остаётся исходник. GIF, HEIC и документы не трогаются.

По умолчанию — пробный прогон (ничего не пишет). Пример в прод-контейнере:

    python scripts/recompress_uploads.py /app/uploads            # что изменится
    python scripts/recompress_uploads.py /app/uploads --apply    # записать
"""
import argparse
import os
import shutil
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from image_processing import InvalidImageError, recompress_same_format  # noqa: E402

EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _mb(size: int) -> str:
    return f"{size / 1024 / 1024:.2f} МБ"


def _replace_atomically(path: Path, data: bytes) -> None:
    """Пишет во временный файл рядом и подменяет исходник одной операцией."""
    fd, tmp_name = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        # mkstemp создаёт файл с правами 0600 — вернуть права исходника,
        # иначе nginx (другой пользователь) не сможет его отдать
        shutil.copymode(path, tmp_name)
        os.replace(tmp_name, path)
    except BaseException:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)
        raise


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("directory", type=Path, help="каталог загрузок (в контейнере — /app/uploads)")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true", help="только показать (по умолчанию)")
    mode.add_argument("--apply", action="store_true", help="записать изменения")
    args = parser.parse_args(argv)

    if not args.directory.is_dir():
        parser.error(f"каталог не найден: {args.directory}")

    print("РЕЖИМ: запись (--apply)" if args.apply else "РЕЖИМ: пробный прогон, ничего не пишется (--apply для записи)")
    total_before = total_after = errors = 0
    for path in sorted(args.directory.iterdir()):
        if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
            continue
        before = path.stat().st_size
        total_before += before
        try:
            data = recompress_same_format(path.read_bytes())
        except InvalidImageError as exc:
            errors += 1
            total_after += before
            print(f"ОШИБКА {path.name}: {exc}")
            continue

        if len(data) >= before:
            total_after += before
            print(f"{path.name}: {_mb(before)} → {_mb(len(data))}, не меньше — оставлен исходник")
            continue

        total_after += len(data)
        print(f"{path.name}: {_mb(before)} → {_mb(len(data))} (−{100 - len(data) * 100 // before}%)")
        if args.apply:
            _replace_atomically(path, data)

    print(f"ИТОГО: {_mb(total_before)} → {_mb(total_after)}" + ("" if args.apply else " (не записано)"))
    if errors:
        print(f"Ошибок: {errors}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
