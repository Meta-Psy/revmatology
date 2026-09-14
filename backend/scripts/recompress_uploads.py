"""Пережатие уже загруженных изображений НА МЕСТЕ.

Имя и формат файла сохраняются, поэтому ссылки в БД остаются рабочими:
поворот по EXIF, EXIF/GPS удаляются, длинная сторона не больше 1600 px,
JPEG q85 / PNG optimize / WEBP q85. Если результат меньше исходника менее
чем на 5 % — остаётся исходник. GIF, HEIC, анимация и документы не трогаются.
Сбой на одном файле попадает в отчёт, прогон продолжается (код выхода 1).

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
MIN_GAIN = 0.05  # меньший выигрыш не стоит повторной потери качества JPEG


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
        try:
            before = path.stat().st_size
            original = path.read_bytes()
            data = recompress_same_format(original)
            gain = 1 - len(data) / before if before else 0
            if gain < MIN_GAIN:
                data = original
                print(f"{path.name}: {_mb(before)} → {_mb(before)}, выигрыш меньше 5% — оставлен исходник")
            else:
                print(f"{path.name}: {_mb(before)} → {_mb(len(data))} (−{round(gain * 100)}%)")
                if args.apply:
                    _replace_atomically(path, data)
        except (InvalidImageError, OSError) as exc:
            # один сбойный файл (битый, нет места, нет прав) не обрывает прогон
            errors += 1
            print(f"ОШИБКА {path.name}: {exc}")
            continue
        total_before += before
        total_after += len(data)

    print(f"ИТОГО: {_mb(total_before)} → {_mb(total_after)}" + ("" if args.apply else " (не записано)"))
    if errors:
        print(f"Ошибок: {errors}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
