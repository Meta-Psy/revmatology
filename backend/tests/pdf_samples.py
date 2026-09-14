"""Генераторы и фикстуры PDF для тестов рисования страниц (К-08).

Обычные PDF собирает сам pypdfium2. Закладки и пароль он писать не умеет,
поэтому они лежат готовыми файлами в tests/fixtures/ — собраны разово
pypdf 5.4.0 (в зависимости проекта не входит):

- outline.pdf — 5 страниц 200×100 pt; закладки «Введение» → 1, «Секция 1» → 2
  ⊃ «Доклад 1.1» → 3 ⊃ «Тезисы» → 4; «Приложения» без ссылки ⊃
  «Приложение А» → 5 (все ссылки — действия GoTo, как у большинства программ);
- encrypted.pdf — 1 страница, пароль на открытие «secret» (RC4-128);
- owner_password_only.pdf — 1 страница, только пароль владельца (запрет
  правки): открывается без пароля и обязан рисоваться.
"""
import io
from pathlib import Path

import pypdfium2 as pdfium

FIXTURES = Path(__file__).resolve().parent / "fixtures"
A4 = (595, 842)
# Широкая низкая страница: при ширине 1600 px картинка 1600×160 — рисуется и
# кодируется в разы быстрее A4. Для тестов, где размеры страницы не важны.
STRIP = (200, 20)


def pdf_bytes(sizes) -> bytes:
    """PDF с пустыми страницами заданных размеров (в пунктах)."""
    doc = pdfium.PdfDocument.new()
    try:
        for width, height in sizes:
            doc.new_page(width, height)
        buf = io.BytesIO()
        doc.save(buf)
        return buf.getvalue()
    finally:
        doc.close()


def write_pdf(path: Path, sizes) -> Path:
    path.write_bytes(pdf_bytes(sizes))
    return path


def copy_fixture(name: str, directory: Path, as_name: str = None) -> Path:
    target = directory / (as_name or name)
    target.write_bytes((FIXTURES / name).read_bytes())
    return target
