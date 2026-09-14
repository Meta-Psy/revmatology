"""scripts/render_pdf_pages.py: рисование одного PDF и добор (--backfill) по БД (К-08)."""
import asyncio
import json
import subprocess
import sys

import pytest
from sqlalchemy.ext.asyncio import create_async_engine

import config as app_config
import pdf_pages
from database.connection import Base
from database.models import Congress
from scripts import render_pdf_pages
from scripts.render_pdf_pages import main
from tests import pdf_samples as samples


@pytest.fixture
def uploads(tmp_path):
    directory = tmp_path / "uploads"
    directory.mkdir()
    return directory


def _args(uploads, *extra):
    return [*map(str, extra), "--uploads-dir", str(uploads)]


# ---------- один файл ----------

def test_single_file_renders_and_reports(uploads, capsys):
    samples.write_pdf(uploads / "doc.pdf", [samples.STRIP] * 2)

    assert main(_args(uploads, uploads / "doc.pdf")) == 0

    assert pdf_pages.read_manifest(uploads / "doc.pdf")["rendered"] == 2
    out = capsys.readouterr().out
    assert "doc.pdf" in out and "2 стр." in out


def test_single_file_already_rendered_is_skipped(uploads, capsys, monkeypatch):
    samples.write_pdf(uploads / "doc.pdf", [samples.STRIP])
    assert main(_args(uploads, uploads / "doc.pdf")) == 0
    capsys.readouterr()
    monkeypatch.setattr(pdf_pages, "_render_page", lambda *a: pytest.fail("перерисовка готового"))

    assert main(_args(uploads, uploads / "doc.pdf")) == 0
    assert "уже есть" in capsys.readouterr().out


def test_single_file_error_exits_1_with_reason(uploads, capsys):
    samples.copy_fixture("encrypted.pdf", uploads, "secret.pdf")

    assert main(_args(uploads, uploads / "secret.pdf")) == 1

    out = capsys.readouterr().out
    assert "ОШИБКА" in out and "secret.pdf" in out and "паролем" in out
    assert (uploads / "secret.pages.error.json").is_file()


@pytest.mark.parametrize("name", ["../outside.pdf", "missing.pdf", "notes.txt"])
def test_single_file_bad_path_exits_1(uploads, capsys, name):
    samples.write_pdf(uploads.parent / "outside.pdf", [samples.STRIP])
    (uploads / "notes.txt").write_text("x", encoding="utf-8")

    assert main(_args(uploads, uploads / name)) == 1

    assert "ОШИБКА" in capsys.readouterr().out
    assert not list(uploads.parent.glob("outside.pages*"))


def test_path_and_backfill_are_mutually_exclusive(uploads):
    with pytest.raises(SystemExit):
        main(_args(uploads, uploads / "doc.pdf", "--backfill"))
    with pytest.raises(SystemExit):
        main(_args(uploads))


@pytest.mark.skipif(not sys.platform.startswith("linux"), reason="flock — только Linux")
def test_single_file_renders_under_lock(uploads, monkeypatch):
    import fcntl

    samples.write_pdf(uploads / "doc.pdf", [samples.STRIP])
    real_render = pdf_pages.render
    lock_was_held = []

    def render_checking_lock(*args, **kwargs):
        with open(uploads / render_pdf_pages.LOCK_NAME, "a") as other:
            try:
                fcntl.flock(other, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                lock_was_held.append(True)
        return real_render(*args, **kwargs)

    monkeypatch.setattr(pdf_pages, "render", render_checking_lock)

    assert main(_args(uploads, uploads / "doc.pdf")) == 0
    assert lock_was_held == [True]


@pytest.mark.skipif(not sys.platform.startswith("linux"), reason="RLIMIT_AS — только Linux")
def test_memory_limit_is_address_space(monkeypatch):
    import resource

    limits = []
    monkeypatch.setattr(resource, "setrlimit", lambda kind, value: limits.append((kind, value)))

    render_pdf_pages._limit_memory()

    assert limits == [(resource.RLIMIT_AS, (render_pdf_pages.MEMORY_LIMIT, render_pdf_pages.MEMORY_LIMIT))]


# ---------- добор по БД ----------

@pytest.fixture
def database(tmp_path, monkeypatch):
    """Файловая SQLite: скрипт открывает БД сам, по settings.DATABASE_URL."""
    url = f"sqlite+aiosqlite:///{(tmp_path / 'backfill.db').as_posix()}"
    monkeypatch.setattr(app_config.settings, "DATABASE_URL", url)

    def _add_congresses(*congresses):
        async def _run():
            engine = create_async_engine(url)
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
                for fields in congresses:
                    await conn.execute(Congress.__table__.insert().values(
                        title_ru="К", title_uz="K", title_en="C", **fields,
                    ))
            await engine.dispose()

        asyncio.run(_run())

    return _add_congresses


def test_backfill_renders_missing_pdfs_from_db(uploads, database, capsys):
    samples.write_pdf(uploads / "program.pdf", [samples.STRIP] * 2)
    samples.copy_fixture("encrypted.pdf", uploads, "rules-secret.pdf")
    samples.write_pdf(uploads / "done.pdf", [samples.STRIP])
    pdf_pages.render(uploads / "done.pdf", uploads)
    (uploads / "letter.pdf").write_bytes(b"%PDF-1.4 info letter")  # поле info_letter_* — не наше
    database(
        {
            "program_file_ru": "/uploads/program.pdf",
            "program_file_uz": "/uploads/program.pdf",  # тот же файл на двух языках — рисуем один раз
            "program_file_en": "https://example.com/program.pdf",
            "young_scientists_file_ru": "/uploads/rules-secret.pdf",
            "young_scientists_file_uz": "/uploads/rules.docx",
            "info_letter_file_ru": "/uploads/letter.pdf",
        },
        {"young_scientists_file_en": "/uploads/done.pdf", "program_file_ru": ""},
    )

    code = main(_args(uploads, "--backfill"))

    out = capsys.readouterr().out
    assert code == 1, out  # защищённый паролем файл — ошибка в отчёте
    assert pdf_pages.read_manifest(uploads / "program.pdf")["rendered"] == 2
    assert json.loads((uploads / "rules-secret.pages.error.json").read_text(encoding="utf-8"))["error"] == "encrypted"
    assert not (uploads / "letter.pages").exists()
    assert "program.pdf" in out and "rules-secret.pdf" in out
    assert out.count("program.pdf") == 1
    assert "ИТОГО: готово 1, ошибок 1, уже были готовы 1" in out


def test_backfill_all_good_exits_0(uploads, database, capsys):
    samples.write_pdf(uploads / "a.pdf", [samples.STRIP])
    database({"program_file_ru": "/uploads/a.pdf"})

    assert main(_args(uploads, "--backfill")) == 0
    assert "ИТОГО: готово 1, ошибок 0, уже были готовы 0" in capsys.readouterr().out
    assert pdf_pages.read_manifest(uploads / "a.pdf") is not None


def test_backfill_reports_missing_file(uploads, database, capsys):
    database({"young_scientists_file_ru": "/uploads/lost.pdf"})

    assert main(_args(uploads, "--backfill")) == 1
    out = capsys.readouterr().out
    assert "lost.pdf" in out and "не найден" in out


def test_backfill_kills_hung_render_and_marks_timeout(uploads, database, capsys, monkeypatch):
    samples.write_pdf(uploads / "hang.pdf", [samples.STRIP])
    database({"program_file_ru": "/uploads/hang.pdf"})

    def hung(cmd, **kwargs):
        raise subprocess.TimeoutExpired(cmd, kwargs["timeout"])

    monkeypatch.setattr(render_pdf_pages.subprocess, "run", hung)

    assert main(_args(uploads, "--backfill")) == 1

    error = json.loads((uploads / "hang.pages.error.json").read_text(encoding="utf-8"))
    assert error["error"] == "timeout"
    assert "hang.pdf" in capsys.readouterr().out
