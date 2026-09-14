"""Генераторы тестовых изображений — общие для тестов загрузки и скрипта."""
from io import BytesIO

from PIL import Image

KEY_GREEN = (0, 255, 0)


def noise(size, mode="RGB"):
    """Серый шум: как у фото, файл плохо сжимается."""
    return Image.effect_noise(size, 60).convert(mode)


def to_bytes(im, fmt="PNG", **kwargs):
    buf = BytesIO()
    im.save(buf, fmt, **kwargs)
    return buf.getvalue()


def key_transparent_png(mode, size):
    """PNG с прозрачностью по ключу цвета (чанк tRNS): левая половина
    прозрачная, правая — шум, который никогда не совпадает с ключом."""
    w, h = size
    gray = noise(size, "L").point(lambda v: v // 2 + 64)  # 64..191: не 0 и не ключ
    if mode == "RGB":
        im = gray.convert("RGB")
        im.paste(KEY_GREEN, (0, 0, w // 2, h))
        return to_bytes(im, transparency=KEY_GREEN)
    if mode == "L":
        im = gray.copy()
        im.paste(0, (0, 0, w // 2, h))
        return to_bytes(im, transparency=0)
    if mode == "P":
        im = Image.frombytes("P", size, gray.tobytes())
        im.putpalette(list(KEY_GREEN) + [c for v in range(1, 256) for c in (v, v, v)])
        im.paste(0, (0, 0, w // 2, h))
        return to_bytes(im, transparency=0)
    raise ValueError(mode)


def assert_left_transparent_right_opaque(im):
    """Левая четверть прозрачная, правая — непрозрачная (граница не проверяется)."""
    rgba = im.convert("RGBA")
    w, h = rgba.size
    assert rgba.getpixel((w // 8, h // 2))[3] == 0, "прозрачность потеряна"
    assert rgba.getpixel((w * 7 // 8, h // 2))[3] == 255


def i16_png(size, value=30000):
    """16-битный серый PNG (Pillow открывает как I;16)."""
    return to_bytes(Image.new("I;16", size, value))


def partial_alpha_png(size):
    """RGBA-шум с частичной прозрачностью: альфа — градиент сверху вниз 0→255."""
    im = noise(size, "RGB")
    im.putalpha(Image.linear_gradient("L").resize(size))
    return to_bytes(im)
