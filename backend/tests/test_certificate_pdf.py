"""Сборка сертификата (К-11): наложение имени на PDF-шаблон и прибор покрытия шрифта.

Шаблоны генерируются reportlab в тесте — в репозитории бланков нет.
"""
import io

import pytest
from fontTools.ttLib import TTFont as FontToolsFont
from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

from functions import certificate_pdf as cpdf
from functions.certificate_names import normalize_name
from functions.certificate_pdf import FONT_NAME, FONT_PATH, REQUIRED_CHARS, Box, fit_lines, render_certificate

LONGEST_NAME = "Абдурахманова Маликахон Шухратжоновна"  # самое длинное имя ТЗ §11
BOX = Box(x_mm=30, y_mm=90, w_mm=237, h_mm=25)


def _template(pagesize, pages=1) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=pagesize)
    for n in range(pages):
        c.setFont("Helvetica", 30)
        c.drawString(72, pagesize[1] - 100, "CERTIFICATE" if n == 0 else f"PAGE {n + 1}")
        c.showPage()
    c.save()
    return buf.getvalue()


@pytest.fixture(scope="module")
def landscape_template():
    return _template(landscape(A4), pages=2)


@pytest.fixture(scope="module")
def portrait_template():
    return _template(A4)


def _first_page_text(pdf: bytes) -> str:
    return PdfReader(io.BytesIO(pdf)).pages[0].extract_text()


def _squash(text: str) -> str:
    """extract_text курсивного TTF может вставлять/терять пробелы — сравниваем без них."""
    return "".join(normalize_name(text).split())


# ==================== render_certificate ====================

@pytest.mark.parametrize("name", [
    "Шодиева Ситора Баходировна",
    "Қодирова Ўғилой Ҳасановна",
    "Oʻgʻiloy Karimova",
])
def test_render_keeps_pages_and_contains_name(landscape_template, name):
    pdf = render_certificate(landscape_template, name, BOX, 40, 16)
    reader = PdfReader(io.BytesIO(pdf))
    assert len(reader.pages) == 2
    text = reader.pages[0].extract_text()
    assert "CERTIFICATE" in text
    assert _squash(name) in _squash(text)
    assert "PAGE 2" in reader.pages[1].extract_text()


def test_render_portrait(portrait_template):
    box = Box(x_mm=20, y_mm=130, w_mm=170, h_mm=20)
    pdf = render_certificate(portrait_template, LONGEST_NAME, box, 40, 16)
    reader = PdfReader(io.BytesIO(pdf))
    assert len(reader.pages) == 1
    assert _squash(LONGEST_NAME) in _squash(reader.pages[0].extract_text())


def test_render_embeds_font(landscape_template):
    pdf = render_certificate(landscape_template, "Алиев Али", BOX, 40, 16)
    fonts = PdfReader(io.BytesIO(pdf)).pages[0]["/Resources"]["/Font"]
    embedded = [
        f for f in (ref.get_object() for ref in fonts.values())
        if "/DescendantFonts" not in f and "/FontDescriptor" in f and "/FontFile2" in f["/FontDescriptor"]
    ]
    assert embedded, "шрифт имени не встроен (нет FontFile2)"


def test_render_rotated_template():
    """/Rotate 90: рамка меряется по видимой странице — поворот переносится в содержимое."""
    writer = PdfWriter(clone_from=io.BytesIO(_template(A4)))
    writer.pages[0].rotate(90)
    buf = io.BytesIO()
    writer.write(buf)

    pdf = render_certificate(buf.getvalue(), "Алиев Али", BOX, 40, 16)
    page = PdfReader(io.BytesIO(pdf)).pages[0]
    assert page.rotation == 0
    assert float(page.mediabox.width) > float(page.mediabox.height)  # видимая страница альбомная
    assert _squash("Алиев Али") in _squash(page.extract_text())
    _assert_name_inside_box(page, "Алиев Али", BOX)


def _name_fragments(page, name: str) -> list[tuple[str, float, float, float]]:
    """Куски текста имени: (текст, x, y базовой линии, ширина) в пунктах страницы."""
    found = []

    def _visit(text, cm, tm, font_dict, font_size):
        text = text.strip()
        if not _squash(text) or _squash(text) not in _squash(name):
            return
        a, b, c, d, e, f = tm
        ca, cb, cc, cd, ce, cf = cm
        # точка начала строки: tm × cm
        x, y = e * ca + f * cc + ce, e * cb + f * cd + cf
        scale = (a * ca + b * cc) or 1.0  # горизонтальный масштаб tm × cm
        found.append((text, x, y, stringWidth(text, FONT_NAME, font_size * scale)))

    page.extract_text(visitor_text=_visit)
    return found


def _assert_name_inside_box(page, name: str, box: Box) -> None:
    top = float(page.cropbox.top)
    left = float(page.cropbox.left)
    x0, x1 = left + box.x_mm * mm, left + (box.x_mm + box.w_mm) * mm
    y0, y1 = top - (box.y_mm + box.h_mm) * mm, top - box.y_mm * mm
    fragments = _name_fragments(page, name)
    assert fragments, "имя не найдено"
    for text, x, y, width in fragments:
        assert x0 - 0.5 <= x and x + width <= x1 + 0.5, (text, x, width, (x0, x1))
        assert y0 <= y <= y1, (text, y, (y0, y1))


def test_name_inside_box_check_catches_misplaced_name():
    """Прибор различает: то же имя против сдвинутой рамки — падает."""
    pdf = render_certificate(_template(landscape(A4)), "Алиев Али", BOX, 40, 16)
    page = PdfReader(io.BytesIO(pdf)).pages[0]
    _assert_name_inside_box(page, "Алиев Али", BOX)
    with pytest.raises(AssertionError):
        _assert_name_inside_box(page, "Алиев Али", Box(x_mm=BOX.x_mm, y_mm=BOX.y_mm + 40, w_mm=BOX.w_mm, h_mm=BOX.h_mm))
    with pytest.raises(AssertionError):
        _assert_name_inside_box(page, "Алиев Али", Box(x_mm=BOX.x_mm, y_mm=BOX.y_mm, w_mm=20, h_mm=BOX.h_mm))


def test_outline_changes_output(landscape_template):
    plain = render_certificate(landscape_template, "Алиев Али", BOX, 40, 16)
    outlined = render_certificate(landscape_template, "Алиев Али", BOX, 40, 16, outline=True)
    assert plain != outlined


def test_render_accepts_color(landscape_template):
    pdf = render_certificate(landscape_template, "Алиев Али", BOX, 40, 16, color="#B45309")
    assert len(PdfReader(io.BytesIO(pdf)).pages) == 2


# ==================== fit_lines ====================

def test_short_name_is_bigger_than_long():
    w, h = BOX.w_mm * mm, BOX.h_mm * mm
    short_lines, short_size = fit_lines("Алиев Али", w, h, 40, 16)
    long_lines, long_size = fit_lines(LONGEST_NAME, 150 * mm, h, 40, 16)
    assert short_lines == ["Алиев Али"] and len(long_lines) == 1
    assert short_size > long_size
    assert stringWidth(LONGEST_NAME, FONT_NAME, long_size) <= 150 * mm


def test_size_steps_are_half_points():
    _, size = fit_lines(LONGEST_NAME, 150 * mm, 25 * mm, 40, 16)
    assert size * 2 == int(size * 2)


def test_height_limits_size():
    _, size = fit_lines("Али", 300 * mm, 10 * mm, 40, 16)
    assert size < 40


def test_very_long_name_breaks_in_two():
    name = " ".join(["Абдурахманова"] * 6)[:80]
    assert len(name) == 80
    w, h = 150 * mm, 25 * mm
    lines, size = fit_lines(name, w, h, 40, 16)
    assert len(lines) == 2
    assert " ".join(lines) == name
    for line in lines:
        assert stringWidth(line, FONT_NAME, size) <= w


def test_no_space_falls_back_to_min_single_line():
    lines, size = fit_lines("А" * 200, 50 * mm, 25 * mm, 40, 16)
    assert (lines, size) == (["А" * 200], 16)


# ==================== подмена апострофа ====================

def test_apostrophe_substitution_when_font_lacks_it():
    cmap_without_okina = {ord(ch) for ch in "Ogiloy’'"}
    assert cpdf.substitute_missing("Oʻgʻiloy", cmap_without_okina) == "O’g’iloy"
    assert cpdf.substitute_missing("Oʻgʻiloy", {ord(ch) for ch in "Ogiloy'"}) == "O'g'iloy"
    assert cpdf.substitute_missing("Oʻgʻiloy", {ord(ch) for ch in "Ogiloyʻ"}) == "Oʻgʻiloy"


# ==================== прибор покрытия шрифта ====================

def test_required_chars_set():
    for ch in "АЯаяЁёЎўҚқҒғҲҳAZazʻ -.":
        assert ch in REQUIRED_CHARS


def test_font_covers_required_chars():
    font = FontToolsFont(str(FONT_PATH))
    assert "glyf" in font, "контуры не TrueType — reportlab CFF не встраивает"
    cmap = font.getBestCmap()
    missing = [ch for ch in REQUIRED_CHARS if ord(ch) not in cmap]
    if missing == ["ʻ"]:  # допущенная подмена — тогда нужен запасной знак
        assert ord("’") in cmap or ord("'") in cmap
    else:
        assert not missing, f"в шрифте нет знаков: {missing!r}"


def test_font_license_is_next_to_font():
    assert (FONT_PATH.parent / "OFL.txt").is_file()
