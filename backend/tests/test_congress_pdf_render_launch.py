"""Запуск рисования страниц PDF после сохранения конгресса (К-08).

API ставит фоновую задачу для присланных program_file_* /
young_scientists_file_* со значением /uploads/<name>.pdf, если у файла нет
страниц и повтор имеет смысл (нет error.json или в нём internal/timeout) —
так повторное «Сохранить» само перезапускает сорвавшееся рисование. Ответ не
ждёт рисования, сбой рисования не влияет на сохранение.
"""
import asyncio
import json
import sys

import pytest

import pdf_pages
from api import congress as congress_module
from api.congress import launch_pdf_render  # настоящий: conftest подменяет атрибут модуля
from tests import pdf_samples as samples


@pytest.fixture
def uploads(tmp_path, monkeypatch):
    directory = tmp_path / "uploads"
    directory.mkdir()
    monkeypatch.setattr(congress_module, "UPLOAD_DIR", str(directory))
    return directory.resolve()


@pytest.fixture
def launched(pdf_renders, uploads):
    """Пути, для которых API поставил рисование (подменённый запускатель из conftest)."""
    return pdf_renders


async def _create(client, **fields):
    response = await client.post(
        "/api/congress/congresses",
        json={"title_ru": "Конгресс", "title_uz": "Kongress", "title_en": "Congress", **fields},
    )
    assert response.status_code == 200, response.text
    return response.json()


def _pdf(uploads, name):
    path = uploads / name
    path.write_bytes(b"%PDF-1.4 stub")
    return path


def _error_json(uploads, stem, code):
    (uploads / f"{stem}.pages.error.json").write_text(
        json.dumps({"version": 1, "source": f"{stem}.pdf", "error": code, "message": "x"}), encoding="utf-8"
    )


async def test_create_schedules_only_uploaded_pdfs(client, uploads, launched):
    for name in ("program.pdf", "rules.pdf", "letter.pdf"):
        _pdf(uploads, name)
    await _create(
        client,
        program_file_ru="/uploads/program.pdf",
        program_file_uz="https://example.com/program.pdf",
        program_file_en="",
        young_scientists_file_ru="/uploads/rules.pdf",
        young_scientists_file_uz="/uploads/rules.docx",
        young_scientists_file_en="/uploads/program.pdf",  # тот же файл — одна задача
        info_letter_file_ru="/uploads/letter.pdf",  # информационное письмо страниц не получает
    )

    assert launched == [uploads / "program.pdf", uploads / "rules.pdf"]


async def test_create_without_files_schedules_nothing(client, launched):
    await _create(client)
    assert launched == []


async def test_create_skips_missing_files_and_unsafe_names(client, uploads, launched):
    _pdf(uploads, "a b.pdf")
    await _create(client, program_file_ru="/uploads/lost.pdf", program_file_uz="/uploads/a b.pdf")
    assert launched == []


async def test_update_schedules_only_pdfs_without_pages(client, uploads, launched):
    program = _pdf(uploads, "program.pdf")
    _pdf(uploads, "rules-uz.pdf")
    created = await _create(client, program_file_ru="/uploads/program.pdf")
    assert launched == [program]
    launched.clear()
    # страницы программы готовы
    samples.write_pdf(program, [samples.STRIP])
    pdf_pages.render(program, uploads)
    url = f"/api/congress/congresses/{created['id']}"

    # форма админки шлёт все поля: файл с готовыми страницами задачу не ставит
    response = await client.put(url, json={
        "title_ru": "Новое", "program_file_ru": "/uploads/program.pdf", "young_scientists_file_ru": None,
    })
    assert response.status_code == 200, response.text
    assert launched == []

    response = await client.put(url, json={"title_ru": "Ещё новее"})
    assert response.status_code == 200, response.text
    assert launched == []

    response = await client.put(url, json={
        "program_file_ru": "/uploads/program.pdf", "young_scientists_file_uz": "/uploads/rules-uz.pdf",
    })
    assert response.status_code == 200, response.text
    assert launched == [uploads / "rules-uz.pdf"]

    launched.clear()
    response = await client.put(url, json={"program_file_ru": "", "young_scientists_file_uz": None})
    assert response.status_code == 200, response.text
    assert launched == []


@pytest.mark.parametrize(
    ("state", "restarted"),
    [("nothing", True), ("internal", True), ("timeout", True), ("encrypted", False), ("corrupt", False),
     ("empty", False)],
)
async def test_resave_restarts_render_only_when_it_makes_sense(client, uploads, launched, state, restarted):
    rules = _pdf(uploads, "rules.pdf")
    created = await _create(client, young_scientists_file_ru="/uploads/rules.pdf")
    launched.clear()
    if state != "nothing":
        _error_json(uploads, "rules", state)

    response = await client.put(
        f"/api/congress/congresses/{created['id']}",
        json={"title_ru": "Конгресс", "young_scientists_file_ru": "/uploads/rules.pdf"},
    )

    assert response.status_code == 200, response.text
    assert launched == ([rules] if restarted else [])


async def test_render_failure_does_not_affect_save(client, uploads, monkeypatch, caplog):
    async def broken_exec(*args, **kwargs):
        raise OSError("нельзя запустить процесс")

    monkeypatch.setattr(congress_module, "launch_pdf_render", launch_pdf_render)
    monkeypatch.setattr(congress_module.asyncio, "create_subprocess_exec", broken_exec)
    _pdf(uploads, "rules.pdf")

    created = await _create(client, young_scientists_file_ru="/uploads/rules.pdf")

    detail = await client.get(f"/api/congress/congresses/{created['id']}/detail")
    assert detail.json()["young_scientists_file_ru"] == "/uploads/rules.pdf"
    assert "rules.pdf" in caplog.text


# ---------- сам запускатель ----------

class _FakeProcess:
    def __init__(self, returncode=0, output=b"", hang=False):
        self.returncode = None if hang else returncode
        self._output = output
        self._hang = hang
        self.killed = False

    async def communicate(self):
        if self._hang:
            await asyncio.sleep(3600)
        return self._output, None

    def kill(self):
        self.killed = True
        self.returncode = -9

    async def wait(self):
        return self.returncode


async def test_launcher_runs_render_script_in_separate_process(uploads, monkeypatch, caplog):
    calls = []
    process = _FakeProcess(output="rules.pdf: готово — 3 стр.".encode("utf-8"))

    async def fake_exec(*args, **kwargs):
        calls.append((args, kwargs))
        return process

    monkeypatch.setattr(congress_module.asyncio, "create_subprocess_exec", fake_exec)
    caplog.set_level("INFO", logger=congress_module.logger.name)

    # каталог загрузок — настроенный UPLOAD_DIR, а не родитель пути PDF
    await launch_pdf_render(uploads / "sub" / ".." / "rules.pdf")

    (args, kwargs), = calls
    assert args == (
        sys.executable, "-m", "scripts.render_pdf_pages", str(uploads / "sub" / ".." / "rules.pdf"),
        "--uploads-dir", str(uploads),
    )
    assert kwargs["cwd"] == congress_module.BACKEND_DIR
    assert "готово — 3 стр." in caplog.text


async def test_launcher_kills_hung_process_and_marks_timeout(uploads, monkeypatch):
    pdf = samples.write_pdf(uploads / "hang.pdf", [samples.STRIP])
    process = _FakeProcess(hang=True)

    async def fake_exec(*args, **kwargs):
        return process

    monkeypatch.setattr(congress_module.asyncio, "create_subprocess_exec", fake_exec)
    monkeypatch.setattr(congress_module, "RENDER_PROCESS_TIMEOUT", 0.05)

    await launch_pdf_render(pdf)

    assert process.killed
    error = json.loads((uploads / "hang.pages.error.json").read_text(encoding="utf-8"))
    assert error["error"] == "timeout"


async def test_launcher_really_renders(uploads):
    """Без подмен: настоящий процесс `python -m scripts.render_pdf_pages`."""
    pdf = samples.write_pdf(uploads / "real.pdf", [samples.STRIP] * 2)

    await launch_pdf_render(pdf)

    assert pdf_pages.read_manifest(pdf)["rendered"] == 2


@pytest.mark.parametrize(
    ("returncode", "expected"),
    [(-pdf_pages.SIGXCPU, "timeout"), (-9, "internal"), (1, "internal")],
)
async def test_launcher_marks_child_that_died_without_error_json(uploads, monkeypatch, returncode, expected):
    pdf = samples.write_pdf(uploads / "died.pdf", [samples.STRIP])

    async def fake_exec(*args, **kwargs):
        return _FakeProcess(returncode=returncode)

    monkeypatch.setattr(congress_module.asyncio, "create_subprocess_exec", fake_exec)

    await launch_pdf_render(pdf)

    error = json.loads((uploads / "died.pages.error.json").read_text(encoding="utf-8"))
    assert error["error"] == expected


async def test_launcher_keeps_error_written_by_child(uploads, monkeypatch):
    pdf = samples.write_pdf(uploads / "secret.pdf", [samples.STRIP])
    _error_json(uploads, "secret", "encrypted")

    async def fake_exec(*args, **kwargs):
        return _FakeProcess(returncode=1)

    monkeypatch.setattr(congress_module.asyncio, "create_subprocess_exec", fake_exec)

    await launch_pdf_render(pdf)

    assert json.loads((uploads / "secret.pages.error.json").read_text(encoding="utf-8"))["error"] == "encrypted"


def test_parent_timeout_is_only_a_last_resort():
    # ожидание замка за другими PDF не должно давать ложный timeout —
    # время рисования ограничивает RLIMIT_CPU в самом процессе
    assert congress_module.RENDER_PROCESS_TIMEOUT >= 45 * 60
