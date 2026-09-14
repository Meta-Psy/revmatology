"""Сжатие изображений — общее для загрузки (api/content.py) и скрипта
scripts/recompress_uploads.py.

Правила: поворот по EXIF-ориентации, EXIF/GPS/XMP не сохраняются (ICC-профиль
цвета сохраняется), длинная сторона не больше MAX_SIDE (меньшие не
увеличиваются), JPEG q85 progressive, PNG optimize, WEBP q85.
"""
from dataclasses import dataclass
from io import BytesIO

import pillow_heif
from PIL import Image, ImageOps, UnidentifiedImageError

pillow_heif.register_heif_opener()

MAX_SIDE = 1600
JPEG_QUALITY = 85
WEBP_QUALITY = 85

# Режимы, в которых ICC-профиль исходника остаётся верным и после сохранения
# (CMYK и прочие переводятся в RGB — их профиль к результату не подходит).
_ICC_SAFE_MODES = {"RGB", "RGBA", "L", "LA", "P"}
_FORMAT_EXT = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}


class InvalidImageError(ValueError):
    """Файл не читается как изображение (битый, обрезанный, не картинка)."""


@dataclass(frozen=True)
class CompressedImage:
    data: bytes
    ext: str  # с точкой: ".jpg" / ".png" / ".webp"
    width: int
    height: int


def _load(data: bytes) -> tuple[Image.Image, str]:
    """Декодирует, уменьшает и поворачивает по EXIF.

    Возвращает копию без метаданных (кроме ICC) и исходный формат.
    """
    try:
        with Image.open(BytesIO(data)) as im:
            source_format = "JPEG" if im.format == "MPO" else im.format  # MPO — JPEG с телефона
            icc = im.info.get("icc_profile") if im.mode in _ICC_SAFE_MODES else None
            if im.mode not in ("RGB", "RGBA", "L", "LA"):
                # палитру/CMYK/16 бит — в полноцвет до ресайза (палитра ресайзится «ступеньками»)
                has_alpha = "A" in im.getbands() or "transparency" in im.info
                im = im.convert("RGBA" if has_alpha else "RGB")
            # thumbnail до поворота: для JPEG он декодирует сразу в уменьшенном
            # масштабе (draft), не раздувая память; рамка квадратная — поворот
            # после неё не нарушает предел длинной стороны
            im.thumbnail((MAX_SIDE, MAX_SIDE))
            im = ImageOps.exif_transpose(im)
            # только пиксели: EXIF, GPS, XMP и прочее из im.info не переносим
            clean = Image.frombytes(im.mode, im.size, im.tobytes())
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError, Image.DecompressionBombError) as exc:
        raise InvalidImageError(str(exc)) from exc
    if icc:
        clean.info["icc_profile"] = icc
    return clean, source_format


def _has_transparency(im: Image.Image) -> bool:
    """Есть ли реально прозрачные пиксели (альфа-канал из одних 255 не в счёт)."""
    return "A" in im.getbands() and im.getchannel("A").getextrema()[0] < 255


def _encode(im: Image.Image, fmt: str) -> bytes:
    icc = im.info.get("icc_profile")
    extra = {"icc_profile": icc} if icc else {}
    buf = BytesIO()
    if fmt == "JPEG":
        if im.mode == "LA":
            im = im.convert("L")
        elif im.mode not in ("RGB", "L"):
            im = im.convert("RGB")
        im.save(buf, "JPEG", quality=JPEG_QUALITY, progressive=True, optimize=True, **extra)
    elif fmt == "PNG":
        im.save(buf, "PNG", optimize=True, **extra)
    elif fmt == "WEBP":
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
        im.save(buf, "WEBP", quality=WEBP_QUALITY, **extra)
    else:
        raise ValueError(f"Неподдерживаемый формат сохранения: {fmt}")
    return buf.getvalue()


def compress_for_upload(data: bytes) -> CompressedImage:
    """Сжатие при загрузке: WEBP → WEBP; с прозрачностью → PNG; остальное
    (JPEG, HEIC/HEIF, PNG без прозрачности) → JPEG."""
    im, source_format = _load(data)
    if source_format == "WEBP":
        fmt = "WEBP"
    elif _has_transparency(im):
        fmt = "PNG"
    else:
        fmt = "JPEG"
    return CompressedImage(_encode(im, fmt), _FORMAT_EXT[fmt], im.width, im.height)


def recompress_same_format(data: bytes) -> bytes:
    """Пережатие с сохранением формата (для уже загруженных файлов: имя и
    ссылки в БД не меняются). Поддерживаются JPEG, PNG, WEBP."""
    im, source_format = _load(data)
    if source_format not in _FORMAT_EXT:
        raise InvalidImageError(f"формат {source_format} не пережимается")
    return _encode(im, source_format)


def probe_size(data: bytes) -> tuple[int, int]:
    """Проверяет, что файл читается как изображение (первый кадр), и
    возвращает его размер. Сам файл не меняется — так сохраняются GIF."""
    try:
        with Image.open(BytesIO(data)) as im:
            im.load()
            return im.size
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError, Image.DecompressionBombError) as exc:
        raise InvalidImageError(str(exc)) from exc
