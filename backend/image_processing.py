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
MAX_PIXELS = 50_000_000  # больше не декодируем: PNG/HEIC раскрываются в память целиком
JPEG_QUALITY = 85
WEBP_QUALITY = 85

# Режимы, в которых ICC-профиль исходника остаётся верным и после сохранения
# (CMYK и прочие переводятся в RGB — их профиль к результату не подходит).
_ICC_SAFE_MODES = {"RGB", "RGBA", "L", "LA", "P"}
_FORMAT_EXT = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}
# Источники без потерь: плоская графика (логотипы) в PNG меньше и без ореолов,
# фото — меньше в JPEG; пробуем оба и берём меньший.
_LOSSLESS_SOURCES = {"PNG", "BMP", "TIFF"}
_DECODE_ERRORS = (UnidentifiedImageError, OSError, SyntaxError, ValueError)
_TOO_LARGE = f"Изображение слишком большое по разрешению — уменьшите до {MAX_PIXELS // 1_000_000} Мп"


class InvalidImageError(ValueError):
    """Файл не читается как изображение (битый, обрезанный, не картинка)."""


class ImageTooLargeError(InvalidImageError):
    """Разрешение больше MAX_PIXELS или «декомпрессионная бомба» по мнению Pillow."""


@dataclass(frozen=True)
class CompressedImage:
    data: bytes
    ext: str  # с точкой: ".jpg" / ".png" / ".webp"
    width: int
    height: int


def _open(data: bytes) -> Image.Image:
    """Открывает (читается только заголовок) и проверяет разрешение."""
    try:
        im = Image.open(BytesIO(data))
    except Image.DecompressionBombError as exc:
        raise ImageTooLargeError(_TOO_LARGE) from exc
    except _DECODE_ERRORS as exc:
        raise InvalidImageError(str(exc)) from exc
    if im.width * im.height > MAX_PIXELS:
        size = f"{im.width}×{im.height}, {im.width * im.height / 1_000_000:.0f} Мп"
        im.close()
        raise ImageTooLargeError(f"{_TOO_LARGE} (сейчас {size})")
    return im


def _load(data: bytes) -> tuple[Image.Image, str]:
    """Декодирует, уменьшает и поворачивает по EXIF.

    Возвращает копию без метаданных (кроме ICC) и исходный формат.
    """
    with _open(data) as im:
        try:
            source_format = "JPEG" if im.format == "MPO" else im.format  # MPO — JPEG с телефона
            icc = im.info.get("icc_profile") if im.mode in _ICC_SAFE_MODES else None
            if source_format == "JPEG":
                # JPEG умеет декодироваться сразу в 1/2…1/8 масштаба. thumbnail просит
                # у draft квадрат 2×MAX_SIDE, и у фото 4:3 масштаб не срабатывает —
                # просим по пропорциям кадра (8064×6048 декодируется как 4032×3024)
                k = MAX_SIDE * 2 / max(im.size)
                if k < 1:
                    im.draft(None, (int(im.width * k), int(im.height * k)))
            if im.mode.startswith("I;16") or im.mode == "I":
                # 16 бит → 8 бит; простой convert обрезал бы всё выше 255 в белое
                im = im.point(lambda v: v / 256).convert("L")
                im.info.pop("transparency", None)  # 16-битный ключ к 8 битам не подходит
            # прозрачность по ключу цвета (tRNS) у P/RGB/L — перевести в альфа-канал,
            # иначе после ресайза и пересохранения прозрачный фон станет цветным
            key_transparency = "transparency" in im.info and "A" not in im.getbands()
            if im.mode not in ("RGB", "RGBA", "L", "LA") or key_transparency:
                if "A" in im.getbands() or "transparency" in im.info:
                    im = im.convert("LA" if im.mode == "L" else "RGBA")
                else:
                    im = im.convert("RGB")
            # thumbnail до поворота: рамка квадратная — поворот после неё не
            # нарушает предел длинной стороны
            im.thumbnail((MAX_SIDE, MAX_SIDE))
            im = ImageOps.exif_transpose(im)
            # только пиксели: EXIF, GPS, XMP и прочее из im.info не переносим
            clean = Image.frombytes(im.mode, im.size, im.tobytes())
        except Image.DecompressionBombError as exc:
            raise ImageTooLargeError(_TOO_LARGE) from exc
        except _DECODE_ERRORS as exc:
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
        if im.mode in ("RGBA", "LA") and not _has_transparency(im):
            im = im.convert(im.mode[:-1])  # альфа из одних 255 — лишний канал
        im.save(buf, "PNG", optimize=True, **extra)
    elif fmt == "WEBP":
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
        im.save(buf, "WEBP", quality=WEBP_QUALITY, **extra)
    else:
        raise ValueError(f"Неподдерживаемый формат сохранения: {fmt}")
    return buf.getvalue()


def _animated_size(data: bytes) -> tuple[int, int] | None:
    """Размер, если в файле больше одного кадра (анимация), иначе None."""
    with _open(data) as im:
        return im.size if getattr(im, "n_frames", 1) > 1 else None


def compress_for_upload(data: bytes) -> CompressedImage:
    """Сжатие при загрузке: WEBP → WEBP (анимированный — как есть);
    с прозрачностью → PNG; PNG/BMP/TIFF без прозрачности → меньший из PNG и
    JPEG; остальное (JPEG, HEIC/HEIF, AVIF) → JPEG."""
    with _open(data) as im:
        if im.format == "WEBP" and getattr(im, "n_frames", 1) > 1:
            return CompressedImage(data, ".webp", *im.size)

    im, source_format = _load(data)
    if source_format == "WEBP":
        candidates = ["WEBP"]
    elif _has_transparency(im):
        candidates = ["PNG"]
    elif source_format in _LOSSLESS_SOURCES:
        candidates = ["PNG", "JPEG"]
    else:
        candidates = ["JPEG"]
    encoded, fmt = min(((_encode(im, f), f) for f in candidates), key=lambda item: len(item[0]))
    return CompressedImage(encoded, _FORMAT_EXT[fmt], im.width, im.height)


def recompress_same_format(data: bytes) -> bytes:
    """Пережатие с сохранением формата (для уже загруженных файлов: имя и
    ссылки в БД не меняются). Поддерживаются JPEG, PNG, WEBP; анимация
    возвращается как есть — первый кадр вместо неё на месте недопустим."""
    if _animated_size(data):
        return data
    im, source_format = _load(data)
    if source_format not in _FORMAT_EXT:
        raise InvalidImageError(f"формат {source_format} не пережимается")
    return _encode(im, source_format)


def probe_size(data: bytes) -> tuple[int, int]:
    """Проверяет, что файл читается как изображение (первый кадр), и
    возвращает его размер. Сам файл не меняется — так сохраняются GIF."""
    with _open(data) as im:
        try:
            im.load()
        except Image.DecompressionBombError as exc:
            raise ImageTooLargeError(_TOO_LARGE) from exc
        except _DECODE_ERRORS as exc:
            raise InvalidImageError(str(exc)) from exc
        return im.size
