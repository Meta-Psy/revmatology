"""P-06: секретарь публикует положение конкурса молодых учёных, участник читает его страницами.

Правило голой базы: состояние строится только через HTTP (`client`), никаких
ORM-фабрик. Каталог загрузок подменён на временный — и для записи
(/api/content/upload), и для раздачи (StaticFiles на /uploads, в проде это
nginx), и для API конгрессов, который ставит рисование.

Рисование в продукте — фоновый процесс `python -m scripts.render_pdf_pages`.
Здесь запускатель подменён (conftest, `pdf_renders`) — прогон проверяет, что
API поставил ровно этот файл, и рисует его тем же скриптом синхронно, в главном
потоке: PDFium нельзя вызывать из нескольких потоков.
"""
import pytest

from api import congress as congress_api
from api import content as content_api
from main import app
from scripts import render_pdf_pages
from tests import pdf_samples as samples

PROCESS_ID = "P-06"


@pytest.fixture
def uploads(tmp_path, monkeypatch):
    directory = tmp_path / "uploads"
    directory.mkdir()
    monkeypatch.setattr(content_api, "UPLOAD_DIR", str(directory))
    monkeypatch.setattr(congress_api, "UPLOAD_DIR", str(directory))
    (static,) = [route.app for route in app.routes if getattr(route, "name", None) == "uploads"]
    monkeypatch.setattr(static, "all_directories", [str(directory)])
    return directory.resolve()


async def test_p06(journey, client, uploads, pdf_renders):
    j = journey(PROCESS_ID)
    pdf_data = (samples.FIXTURES / "outline.pdf").read_bytes()  # 5 страниц с закладками

    # --- upload_pdf ----------------------------------------------------------
    uploaded = await j.step(
        "upload_pdf",
        lambda: client.post(
            "/api/content/upload",
            files={"file": ("Положение конкурса.pdf", pdf_data, "application/pdf")},
        ),
    )
    assert uploaded.status_code == 200, f"[upload_pdf] {uploaded.status_code}: {uploaded.text}"
    pdf_url = uploaded.json()["url"]
    assert pdf_url.startswith("/uploads/") and pdf_url.endswith(".pdf"), f"[upload_pdf] ссылка {pdf_url!r}"
    pdf_name = pdf_url.removeprefix("/uploads/")
    assert (uploads / pdf_name).read_bytes() == pdf_data, "[upload_pdf] PDF сохранён не байт-в-байт"

    # --- save_congress -------------------------------------------------------
    saved = await j.step(
        "save_congress",
        lambda: client.post(
            "/api/congress/congresses",
            json={
                "title_ru": "XII съезд ревматологов",
                "title_uz": "Revmatologlar XII qurultoyi",
                "title_en": "12th Congress of Rheumatologists",
                "young_scientists_ru": "Конкурс молодых учёных: условия участия",
                "young_scientists_file_ru": pdf_url,
            },
        ),
    )
    assert saved.status_code == 200, f"[save_congress] {saved.status_code}: {saved.text}"
    congress_id = saved.json()["id"]
    assert pdf_renders == [uploads / pdf_name], (
        f"[save_congress] API должен был поставить рисование {pdf_name}, поставил {pdf_renders}"
    )

    # --- render_pages --------------------------------------------------------
    code = await j.step(
        "render_pages",
        lambda: render_pdf_pages.main([str(pdf_renders[0]), "--uploads-dir", str(uploads)]),
    )
    assert code == 0, "[render_pages] скрипт рисования завершился с ошибкой"
    assert not (uploads / pdf_name.replace(".pdf", ".pages.error.json")).exists(), (
        "[render_pages] рядом с PDF появился error.json"
    )

    # --- public_detail_readback ----------------------------------------------
    detail = await j.step(
        "public_detail_readback",
        lambda: client.get(f"/api/congress/congresses/{congress_id}/detail"),
    )
    assert detail.status_code == 200, f"[public_detail_readback] {detail.status_code}: {detail.text}"
    payload = detail.json()
    assert payload["young_scientists_file_ru"] == pdf_url, (
        f"[public_detail_readback] файл положения: {payload['young_scientists_file_ru']!r}"
    )
    assert payload["young_scientists_file_uz"] is None and payload["young_scientists_file_en"] is None, (
        "[public_detail_readback] UZ/EN без своих файлов должны быть null — фронт возьмёт RU"
    )

    # --- pages_manifest ------------------------------------------------------
    # путь выводится из ссылки на PDF ровно так, как по договору делает фронт
    pages_base = payload["young_scientists_file_ru"].removesuffix(".pdf") + ".pages"
    manifest_response = await j.step("pages_manifest", lambda: client.get(f"{pages_base}/manifest.json"))
    assert manifest_response.status_code == 200, (
        f"[pages_manifest] {manifest_response.status_code}: {manifest_response.text}"
    )
    manifest = manifest_response.json()
    assert (manifest["version"], manifest["source"]) == (1, pdf_name), f"[pages_manifest] {manifest}"
    assert (manifest["page_count"], manifest["rendered"], manifest["truncated"]) == (5, 5, False), (
        f"[pages_manifest] счёт страниц: {manifest}"
    )
    first = j.contains("pages_manifest", manifest["pages"], lambda p: p["n"] == 1 and p["w"] == 1600)
    assert len(manifest["pages"]) == manifest["page_count"]
    for width in manifest["widths"]:
        image = await client.get(f"{pages_base}/p{first['n']}-{width}.webp")
        assert image.status_code == 200, f"[pages_manifest] p1-{width}.webp: {image.status_code}"
        assert image.content[:4] == b"RIFF" and image.content[8:12] == b"WEBP", (
            f"[pages_manifest] p1-{width}.webp — не WebP"
        )
    assert [item["title"] for item in manifest["outline"]][:2] == ["Введение", "Секция 1"], (
        f"[pages_manifest] оглавление: {manifest['outline']}"
    )
