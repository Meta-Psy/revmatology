"""Сборка именного сертификата (К-11): слой с именем и номером (reportlab) поверх шаблона (pypdf).

Исходная страница не растеризуется: слой с текстом накладывается на её
содержимое, шрифт встраивается подмножеством. Всё в памяти, на диск ничего.
"""
import io
import threading
from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# Подмена шрифта — одна строка; прибор покрытия в tests/test_certificate_pdf.py
FONT_PATH = Path(__file__).resolve().parent.parent / "assets" / "fonts" / "Caveat-Medium.ttf"
FONT_NAME = "CertName"

# Обязательное покрытие шрифта (design-doc §8)
REQUIRED_CHARS = (
    "".join(chr(c) for c in range(ord("А"), ord("я") + 1)) + "Ёё"
    + "ЎўҚқҒғҲҳ"
    + "".join(chr(c) for c in range(ord("A"), ord("Z") + 1))
    + "".join(chr(c) for c in range(ord("a"), ord("z") + 1))
    + "ʻ -."
)

SIZE_STEP = 0.5
NUMBER_DIGITS = 3  # 007, 123, 1234
OUTLINE_COLOR = "#EF4444"

pdfmetrics.registerFont(TTFont(FONT_NAME, str(FONT_PATH)))
_FACE = pdfmetrics.getFont(FONT_NAME).face
_ASCENT = _FACE.ascent / 1000
_DESCENT = _FACE.descent / 1000  # отрицательный
_LINE_HEIGHT = _ASCENT - _DESCENT  # в долях кегля
_CMAP = frozenset(_FACE.charToGlyph)
# Состояние подмножества TTF в reportlab общее на шрифт, а сборку зовут из
# пула потоков — сертификаты собираются по одному (десятки мс каждый).
_RENDER_LOCK = threading.Lock()

# Апострофы узбекской латиницы и запасные знаки, если в шрифте их нет:
# для oʻ/gʻ ближе всего ‘ (U+2018), затем ’, затем '
_APOSTROPHES = "ʻʼ‘’`"
_APOSTROPHE_FALLBACKS = ("‘", "’", "'")


@dataclass(frozen=True)
class Box:
    """Рамка (имени или номера) в мм от левого ВЕРХНЕГО угла видимой первой страницы."""
    x_mm: float
    y_mm: float
    w_mm: float
    h_mm: float


def format_number(number: int) -> str:
    """Порядковый номер на сертификате: ведущие нули до трёх знаков."""
    return str(number).zfill(NUMBER_DIGITS)


def substitute_missing(name: str, cmap) -> str:
    """Апостроф, которого нет в шрифте, → ближайший имеющийся (‘, затем ’, затем ')."""
    fallback = next((ch for ch in _APOSTROPHE_FALLBACKS if ord(ch) in cmap), None)
    if fallback is None:
        return name
    return "".join(fallback if ch in _APOSTROPHES and ord(ch) not in cmap else ch for ch in name)


def _sizes(font_max: float, font_min: float):
    size = font_max
    while size >= font_min:
        yield size
        size -= SIZE_STEP


def _fits(lines: list[str], size: float, box_w_pt: float, box_h_pt: float) -> bool:
    if len(lines) * size * _LINE_HEIGHT > box_h_pt:
        return False
    return all(pdfmetrics.stringWidth(line, FONT_NAME, size) <= box_w_pt for line in lines)


def _split_in_two(name: str) -> list[str] | None:
    """Разрыв по пробелу, ближайшему к середине строки."""
    spaces = [i for i, ch in enumerate(name) if ch == " "]
    if not spaces:
        return None
    middle = len(name) / 2
    i = min(spaces, key=lambda pos: abs(pos - middle))
    return [name[:i], name[i + 1:]]


def fit_lines(name: str, box_w_pt: float, box_h_pt: float, font_max: float, font_min: float) -> tuple[list[str], float]:
    """Одна строка при max..min шагом 0.5; иначе две строки по пробелу ближе к середине; иначе две строки на font_min."""
    for size in _sizes(font_max, font_min):
        if _fits([name], size, box_w_pt, box_h_pt):
            return [name], size
    two = _split_in_two(name)
    if two is None:
        return [name], font_min
    for size in _sizes(font_max, font_min):
        if _fits(two, size, box_w_pt, box_h_pt):
            return two, size
    return two, font_min


def _frame(box: Box, left: float, top: float) -> tuple[float, float, float, float]:
    """Рамка в пунктах пользовательского пространства: x, y низа, ширина, высота."""
    return left + box.x_mm * mm, top - (box.y_mm + box.h_mm) * mm, box.w_mm * mm, box.h_mm * mm


def _draw_lines(c, lines: list[str], size: float, frame) -> None:
    """Блок строк по центру рамки; каждая строка — середина между ascent и descent."""
    x, y_bottom, w, h = frame
    c.setFont(FONT_NAME, size)
    line_h = size * _LINE_HEIGHT
    block_top = y_bottom + h / 2 + len(lines) * line_h / 2
    for n, line in enumerate(lines):
        baseline = block_top - n * line_h - _ASCENT * size
        c.drawCentredString(x + w / 2, baseline, line)


def _overlay(width: float, height: float, name: str, box: Box, font_max: float, font_min: float,
             color: str, outline: bool, left: float, top: float,
             number: str | None, number_box: Box | None, number_font_pt: float) -> bytes:
    """Прозрачный слой с именем (и номером) в координатах пользовательского пространства страницы."""
    frame = _frame(box, left, top)
    lines, size = fit_lines(name, frame[2], frame[3], font_max, font_min)
    number_frame = _frame(number_box, left, top) if number_box is not None else None

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(width, height))
    if outline:
        c.setStrokeColor(HexColor(OUTLINE_COLOR))
        c.setLineWidth(0.5)
        for f in (frame, number_frame):
            if f is not None:
                c.rect(*f, stroke=1, fill=0)
    c.setFillColor(HexColor(color))
    _draw_lines(c, lines, size, frame)
    if number and number_frame is not None:
        _draw_lines(c, [number], number_font_pt, number_frame)
    c.showPage()
    c.save()
    return buf.getvalue()


def render_certificate(template_pdf: bytes, name: str, box: Box, font_max: float, font_min: float,
                       color: str = "#1B3A7A", outline: bool = False, number: str | None = None,
                       number_box: Box | None = None, number_font_pt: float = 14) -> bytes:
    """number рисуется, только если задана и его рамка (number_box); кегль номера постоянный."""
    writer = PdfWriter(clone_from=io.BytesIO(template_pdf))
    page = writer.pages[0]
    if page.rotation % 360:
        # рамку меряют по видимой странице — поворот переносим в содержимое
        page.transfer_rotation_to_content()
    visible = page.cropbox
    media = page.mediabox
    name = substitute_missing(" ".join(name.split()), _CMAP)

    with _RENDER_LOCK:
        layer = _overlay(float(media.right), float(media.top), name, box, font_max, font_min,
                         color, outline, float(visible.left), float(visible.top),
                         number, number_box, number_font_pt)
    page.merge_page(PdfReader(io.BytesIO(layer)).pages[0])

    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()
