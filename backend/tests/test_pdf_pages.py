"""pdf_pages: страницы PDF → WebP 800/1600 + manifest.json по договору §4 (К-08).

PDFium нельзя дёргать из нескольких потоков — все тесты рисуют последовательно,
в главном потоке.
"""
import json
import os
import stat

import pytest
from PIL import Image

import pdf_pages
from pdf_pages import PdfPagesError, render
from tests import pdf_samples as samples


@pytest.fixture
def uploads(tmp_path):
    directory = tmp_path / "uploads"
    directory.mkdir()
    return directory


def _listing(directory):
    return sorted(p.name for p in directory.iterdir())


def _error(pdf):
    return json.loads(pdf.with_name(pdf.stem + ".pages.error.json").read_text(encoding="utf-8"))


def test_render_writes_manifest_and_both_widths(uploads):
    pdf = samples.write_pdf(uploads / "doc.pdf", [samples.A4, (842, 595)])

    manifest = render(pdf, uploads)

    pages_dir = uploads / "doc.pages"
    assert manifest == json.loads((pages_dir / "manifest.json").read_text(encoding="utf-8"))
    assert manifest == {
        "version": 1,
        "source": "doc.pdf",
        "page_count": 2,
        "rendered": 2,
        "truncated": False,
        "widths": [800, 1600],
        "pages": [
            {"n": 1, "w": 1600, "h": 2264},
            {"n": 2, "w": 1600, "h": 1131},
        ],
        "outline": [],
    }
    expected = {"manifest.json"} | {f"p{n}-{w}.webp" for n in (1, 2) for w in (800, 1600)}
    assert set(_listing(pages_dir)) == expected
    for page in manifest["pages"]:
        with Image.open(pages_dir / f"p{page['n']}-1600.webp") as im:
            assert im.format == "WEBP"
            assert im.size == (page["w"], page["h"])
        with Image.open(pages_dir / f"p{page['n']}-800.webp") as im:
            assert im.format == "WEBP"
            assert im.size == (800, round(page["h"] / 2))
    # рядом с PDF — только оригинал и каталог страниц: ни временных каталогов, ни error.json
    assert _listing(uploads) == ["doc.pages", "doc.pdf"]


def test_more_than_60_pages_is_truncated(uploads, monkeypatch):
    # обе ширины уже проверены выше; здесь важен счёт страниц — рисуем мелко
    monkeypatch.setattr(pdf_pages, "WIDTHS", (50, 100))
    pdf = samples.write_pdf(uploads / "long.pdf", [samples.STRIP] * 65)

    manifest = render(pdf, uploads)

    assert manifest["page_count"] == 65
    assert manifest["rendered"] == 60
    assert manifest["truncated"] is True
    assert [p["n"] for p in manifest["pages"]] == list(range(1, 61))
    pages_dir = uploads / "long.pages"
    assert (pages_dir / "p60-50.webp").is_file() and (pages_dir / "p60-100.webp").is_file()
    assert not (pages_dir / "p61-100.webp").exists()
    assert len(_listing(pages_dir)) == 60 * 2 + 1


def test_outline_is_nested_and_one_based(uploads):
    pdf = samples.copy_fixture("outline.pdf", uploads)

    manifest = render(pdf, uploads)

    assert manifest["outline"] == [
        {"title": "Введение", "page": 1, "level": 0, "children": []},
        {"title": "Секция 1", "page": 2, "level": 0, "children": [
            {"title": "Доклад 1.1", "page": 3, "level": 1, "children": [
                {"title": "Тезисы", "page": 4, "level": 2, "children": []},
            ]},
        ]},
        # у «Приложений» нет ссылки на страницу: пункт выпадает, дети поднимаются на его место
        {"title": "Приложение А", "page": 5, "level": 0, "children": []},
    ]


def test_outline_drops_links_beyond_rendered_pages(uploads, monkeypatch):
    monkeypatch.setattr(pdf_pages, "MAX_PAGES", 3)
    pdf = samples.copy_fixture("outline.pdf", uploads)

    manifest = render(pdf, uploads)

    assert (manifest["rendered"], manifest["truncated"]) == (3, True)
    assert manifest["outline"] == [
        {"title": "Введение", "page": 1, "level": 0, "children": []},
        {"title": "Секция 1", "page": 2, "level": 0, "children": [
            {"title": "Доклад 1.1", "page": 3, "level": 1, "children": []},
        ]},
    ]


def test_owner_password_only_pdf_renders(uploads):
    pdf = samples.copy_fixture("owner_password_only.pdf", uploads)

    assert render(pdf, uploads)["rendered"] == 1


@pytest.mark.parametrize(
    ("make", "code", "message"),
    [
        (lambda d: samples.copy_fixture("encrypted.pdf", d, "bad.pdf"), "encrypted", "Файл защищён паролем"),
        (lambda d: _write(d / "bad.pdf", b"%PDF-1.4 not really a pdf"), "corrupt", None),
        (lambda d: _write(d / "bad.pdf", b""), "empty", None),
        (lambda d: samples.write_pdf(d / "bad.pdf", []), "empty", None),
    ],
    ids=["encrypted", "corrupt", "zero-bytes", "zero-pages"],
)
def test_bad_pdf_writes_error_json_and_no_pages(uploads, make, code, message):
    pdf = make(uploads)

    with pytest.raises(PdfPagesError) as info:
        render(pdf, uploads)

    assert info.value.code == code
    error = _error(pdf)
    assert error["version"] == 1
    assert error["source"] == "bad.pdf"
    assert error["error"] == code
    assert error["message"] and error["message"] == info.value.message
    if message:
        assert error["message"] == message
    assert _listing(uploads) == ["bad.pages.error.json", "bad.pdf"]


def _write(path, data):
    path.write_bytes(data)
    return path


def test_timeout_writes_error_and_no_pages(uploads):
    pdf = samples.write_pdf(uploads / "slow.pdf", [samples.STRIP] * 2)

    with pytest.raises(PdfPagesError) as info:
        render(pdf, uploads, timeout=0)

    assert info.value.code == "timeout"
    assert _error(pdf)["error"] == "timeout"
    assert _listing(uploads) == ["slow.pages.error.json", "slow.pdf"]


def test_failure_midway_leaves_no_partial_directory(uploads, monkeypatch):
    pdf = samples.write_pdf(uploads / "doc.pdf", [samples.STRIP] * 3)
    real_render_page = pdf_pages._render_page

    def fail_on_page_2(page, directory, n):
        if n == 2:
            raise RuntimeError("сбой кодировщика")
        return real_render_page(page, directory, n)

    monkeypatch.setattr(pdf_pages, "_render_page", fail_on_page_2)

    with pytest.raises(PdfPagesError) as info:
        render(pdf, uploads)

    assert info.value.code == "internal"
    assert _error(pdf)["error"] == "internal"
    assert _listing(uploads) == ["doc.pages.error.json", "doc.pdf"]


def test_second_call_does_not_rerender(uploads, monkeypatch):
    pdf = samples.write_pdf(uploads / "doc.pdf", [samples.STRIP])
    first = render(pdf, uploads)
    webp = uploads / "doc.pages" / "p1-1600.webp"
    before = webp.stat().st_mtime_ns

    def must_not_render(*args):
        raise AssertionError("готовый манифест — перерисовывать нельзя")

    monkeypatch.setattr(pdf_pages, "_render_page", must_not_render)

    assert render(pdf, uploads) == first
    assert webp.stat().st_mtime_ns == before


def test_success_removes_stale_leftovers_and_old_error(uploads):
    pdf = samples.write_pdf(uploads / "doc.pdf", [samples.STRIP])
    # остатки прошлых попыток: временный каталог убитого процесса, каталог без
    # манифеста и ошибка прошлого прогона
    (uploads / ".doc.pages.tmp-dead").mkdir()
    (uploads / ".doc.pages.tmp-dead" / "p1-800.webp").write_bytes(b"old")
    (uploads / "doc.pages").mkdir()
    (uploads / "doc.pages" / "p1-800.webp").write_bytes(b"old")
    (uploads / "doc.pages.error.json").write_text("{}", encoding="utf-8")
    other = samples.write_pdf(uploads / "other.pdf", [samples.STRIP])
    (uploads / ".other.pages.tmp-alive").mkdir()  # чужой файл — не трогаем

    render(pdf, uploads)

    assert _listing(uploads) == [".other.pages.tmp-alive", "doc.pages", "doc.pdf", "other.pdf"]
    assert (uploads / "doc.pages" / "p1-800.webp").read_bytes() != b"old"
    assert other.is_file()


@pytest.mark.parametrize(
    "bad_path",
    ["../outside.pdf", "sub/inner.pdf", "doc.txt", "doc.pdf.exe", "doc.PDF"],
)
def test_path_outside_uploads_or_not_pdf_is_rejected(uploads, bad_path):
    samples.write_pdf(uploads.parent / "outside.pdf", [samples.A4])
    (uploads / "sub").mkdir()
    for name in ("sub/inner.pdf", "doc.txt", "doc.pdf.exe", "doc.PDF"):
        samples.write_pdf(uploads / name, [samples.A4])
    before_parent = _listing(uploads.parent)
    before_uploads = _listing(uploads)

    with pytest.raises(ValueError):
        render(uploads / bad_path, uploads)

    assert _listing(uploads.parent) == before_parent
    assert _listing(uploads) == before_uploads


def test_absolute_path_elsewhere_is_rejected(uploads, tmp_path):
    elsewhere = tmp_path / "elsewhere"
    elsewhere.mkdir()
    pdf = samples.write_pdf(elsewhere / "doc.pdf", [samples.A4])

    with pytest.raises(ValueError):
        render(pdf, uploads)

    assert _listing(elsewhere) == ["doc.pdf"]


def test_missing_file_is_reported(uploads):
    with pytest.raises(FileNotFoundError):
        render(uploads / "nope.pdf", uploads)
    assert _listing(uploads) == []


@pytest.mark.skipif(os.name == "nt", reason="права доступа POSIX")
def test_files_are_readable_by_nginx(uploads):
    # mkdtemp/mkstemp создают 0700/0600 — nginx (другой пользователь) их бы не отдал
    pdf = samples.write_pdf(uploads / "doc.pdf", [samples.STRIP])
    render(pdf, uploads)
    bad = samples.copy_fixture("encrypted.pdf", uploads, "bad.pdf")
    with pytest.raises(PdfPagesError):
        render(bad, uploads)

    pages_dir = uploads / "doc.pages"
    assert stat.S_IMODE(pages_dir.stat().st_mode) == 0o755
    for path in [*pages_dir.iterdir(), uploads / "bad.pages.error.json"]:
        assert stat.S_IMODE(path.stat().st_mode) & 0o044 == 0o044, path.name


@pytest.mark.parametrize(
    ("url", "expected"),
    [
        ("/uploads/abc.pdf", "abc.pdf"),
        ("/uploads/0f8e-uuid.pdf", "0f8e-uuid.pdf"),
        ("https://example.com/uploads/abc.pdf", None),
        ("/uploads/abc.docx", None),
        ("/uploads/abc.PDF", None),
        ("/uploads/../secret.pdf", None),
        ("/uploads/sub/abc.pdf", None),
        ("/uploads/.pdf", None),
        ("/static/abc.pdf", None),
        ("", None),
        (None, None),
    ],
)
def test_upload_url_to_path(uploads, url, expected):
    result = pdf_pages.upload_url_to_path(url, uploads)
    assert result == (uploads / expected if expected else None)
