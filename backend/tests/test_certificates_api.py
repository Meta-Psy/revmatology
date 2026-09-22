"""API выдачи сертификатов (К-11): публичная выдача и админские маршруты.

Шаблон грузится через API, не через ORM: так проверяется и сама загрузка.
"""
import io
from urllib.parse import quote

import pytest
from pypdf import PdfReader
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from sqlalchemy import select

from api import certificates as cert_api
from database.models import CertificateRecipient
from functions.auth import get_current_admin, get_current_admin_user
from main import app

BASE = "/api/congress"


def _template_pdf(pages=1) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=landscape(A4))
    for _ in range(pages):
        c.drawString(72, 500, "CERTIFICATE")
        c.showPage()
    c.save()
    return buf.getvalue()


TEMPLATE = _template_pdf()


def _squash(text: str) -> str:
    return "".join(text.split()).casefold()


async def _upload_template(client, congress_id, data=TEMPLATE, filename="Бланк.pdf"):
    return await client.post(
        f"{BASE}/congresses/{congress_id}/certificate-template",
        files={"file": (filename, data, "application/pdf")},
    )


async def _add(client, congress_id, full_name, phone=None):
    response = await client.post(
        f"{BASE}/congresses/{congress_id}/certificate-recipients",
        json={"full_name": full_name, "phone": phone},
    )
    assert response.status_code == 200, response.text
    return response.json()


async def _open(client, congress_id, is_open=True):
    response = await client.put(f"{BASE}/congresses/{congress_id}/certificate-settings", json={"is_open": is_open})
    assert response.status_code == 200, response.text
    return response.json()


@pytest.fixture
async def ready(client, congress):
    """Конгресс с шаблоном, открытой выдачей и двумя получателями."""
    assert (await _upload_template(client, congress.id)).status_code == 200
    await _open(client, congress.id)
    with_phone = await _add(client, congress.id, "Шодиева Ситора Баходировна", "+998 90 123 45 67")
    without_phone = await _add(client, congress.id, "Karimov Bobur")
    return congress.id, with_phone, without_phone


async def _issue(client, congress_id, recipient_id, phone=None, headers=None):
    return await client.post(
        f"{BASE}/congresses/{congress_id}/certificates/issue",
        json={"recipient_id": recipient_id, "phone": phone},
        headers=headers,
    )


async def _suggest(client, congress_id, q, headers=None):
    return await client.get(f"{BASE}/congresses/{congress_id}/certificates/suggest", params={"q": q}, headers=headers)


# ==================== status ====================

async def test_status_closed_without_template(client, congress):
    response = await client.get(f"{BASE}/congresses/{congress.id}/certificates/status")
    assert response.json() == {"open": False}
    await _open(client, congress.id)  # открыто, но шаблона нет
    assert (await client.get(f"{BASE}/congresses/{congress.id}/certificates/status")).json() == {"open": False}


async def test_status_open(client, ready):
    congress_id, *_ = ready
    assert (await client.get(f"{BASE}/congresses/{congress_id}/certificates/status")).json() == {"open": True}


async def test_status_unknown_congress(client):
    assert (await client.get(f"{BASE}/congresses/999/certificates/status")).json() == {"open": False}


# ==================== suggest ====================

async def test_suggest_returns_names_without_phones(client, ready):
    congress_id, with_phone, without_phone = ready
    response = await _suggest(client, congress_id, "шодиева")
    assert response.status_code == 200
    assert response.json() == [{"id": with_phone["id"], "full_name": "Шодиева Ситора Баходировна", "needs_phone": True}]
    assert "998" not in response.text

    response = await _suggest(client, congress_id, "bobur KARIM")  # порядок слов любой
    assert response.json() == [{"id": without_phone["id"], "full_name": "Karimov Bobur", "needs_phone": False}]


async def test_suggest_short_query_is_empty(client, ready):
    congress_id, *_ = ready
    assert (await _suggest(client, congress_id, "ш о")).json() == []
    assert (await _suggest(client, congress_id, "шод")).json() != []


async def test_suggest_closed_is_empty(client, ready):
    congress_id, *_ = ready
    await _open(client, congress_id, False)
    assert (await _suggest(client, congress_id, "шодиева")).json() == []


async def test_suggest_at_most_seven_sorted(client, ready):
    congress_id, *_ = ready
    for n in range(10):
        await _add(client, congress_id, f"Алиев Али {chr(ord('Я') - n)}")
    names = [item["full_name"] for item in (await _suggest(client, congress_id, "алиев")).json()]
    assert len(names) == 7
    assert names == sorted(names)


async def test_suggest_normalizes_query_and_escapes_like(client, ready):
    congress_id, *_ = ready
    await _add(client, congress_id, "Ёлкина Oʻgʻiloy")
    assert len((await _suggest(client, congress_id, "  ЕЛКИНА  o'g'iloy ")).json()) == 1
    assert (await _suggest(client, congress_id, "%%%")).json() == []
    assert (await _suggest(client, congress_id, "___")).json() == []


async def test_suggest_other_congress_not_leaked(client, ready, make_congress):
    congress_id, *_ = ready
    other = await make_congress("Другой")
    assert (await _upload_template(client, other.id)).status_code == 200
    await _open(client, other.id)
    assert (await _suggest(client, other.id, "шодиева")).json() == []


# ==================== issue ====================

@pytest.mark.parametrize("phone", ["+998 90 123 45 67", "998901234567", "90 123 45 67"])
async def test_issue_with_phone_forms(client, ready, phone):
    congress_id, with_phone, _ = ready
    response = await _issue(client, congress_id, with_phone["id"], phone)
    assert response.status_code == 200, response.text
    assert response.headers["content-type"] == "application/pdf"
    disposition = response.headers["content-disposition"]
    assert disposition.startswith('attachment; filename="Certificate_Shodieva_Sitora_Bakhodirovna.pdf"')
    assert "filename*=UTF-8''" + quote("Certificate_Шодиева_Ситора_Баходировна.pdf") in disposition
    text = PdfReader(io.BytesIO(response.content)).pages[0].extract_text()
    assert _squash("Шодиева Ситора Баходировна") in _squash(text)


async def test_issue_wrong_or_missing_phone_is_404(client, ready):
    congress_id, with_phone, _ = ready
    for phone in ["+998 91 123 45 67", None, "", "1234567"]:
        response = await _issue(client, congress_id, with_phone["id"], phone)
        assert (response.status_code, response.json()) == (404, {"detail": "not_found"}), phone


async def test_issue_without_phone_in_list(client, ready):
    congress_id, _, without_phone = ready
    response = await _issue(client, congress_id, without_phone["id"])
    assert response.status_code == 200
    assert 'filename="Certificate_Karimov_Bobur.pdf"' in response.headers["content-disposition"]


async def test_issue_other_congress_is_404(client, ready, make_congress):
    congress_id, _, without_phone = ready
    other = await make_congress("Другой")
    assert (await _upload_template(client, other.id)).status_code == 200
    await _open(client, other.id)
    response = await _issue(client, other.id, without_phone["id"])
    assert (response.status_code, response.json()) == (404, {"detail": "not_found"})
    assert (await _issue(client, congress_id, 99999)).status_code == 404


async def test_issue_closed_is_404(client, ready):
    congress_id, _, without_phone = ready
    await _open(client, congress_id, False)
    response = await _issue(client, congress_id, without_phone["id"])
    assert (response.status_code, response.json()) == (404, {"detail": "not_found"})


async def test_sixth_issue_is_403(client, ready, session_factory):
    congress_id, _, without_phone = ready
    for _ in range(cert_api.MAX_DOWNLOADS):
        assert (await _issue(client, congress_id, without_phone["id"])).status_code == 200
    response = await _issue(client, congress_id, without_phone["id"])
    assert (response.status_code, response.json()) == (403, {"detail": "limit_reached"})
    async with session_factory() as s:
        row = (await s.execute(select(CertificateRecipient).where(CertificateRecipient.id == without_phone["id"]))).scalar_one()
    assert row.download_count == 5


async def test_render_failure_returns_counter(client, ready, monkeypatch, session_factory):
    congress_id, _, without_phone = ready

    def _boom(*args, **kwargs):
        raise RuntimeError("broken")

    monkeypatch.setattr(cert_api, "render_certificate", _boom)
    response = await _issue(client, congress_id, without_phone["id"])
    assert response.status_code == 500
    async with session_factory() as s:
        row = (await s.execute(select(CertificateRecipient).where(CertificateRecipient.id == without_phone["id"]))).scalar_one()
    assert row.download_count == 0


async def test_issue_rate_limit(client, ready):
    congress_id, _, without_phone = ready
    headers = {"X-Real-IP": "10.0.0.1"}
    for _ in range(cert_api.ISSUE_PER_MINUTE):
        assert (await _issue(client, congress_id, 99999, headers=headers)).status_code == 404
    response = await _issue(client, congress_id, without_phone["id"], headers=headers)
    assert (response.status_code, response.json()) == (429, {"detail": "too_many_requests"})
    # другой IP — своё окно
    assert (await _issue(client, congress_id, without_phone["id"], headers={"X-Real-IP": "10.0.0.2"})).status_code == 200


async def test_suggest_rate_limit(client, ready):
    congress_id, *_ = ready
    headers = {"X-Real-IP": "10.0.0.3"}
    for _ in range(cert_api.SUGGEST_PER_MINUTE):
        assert (await _suggest(client, congress_id, "шодиева", headers=headers)).status_code == 200
    response = await _suggest(client, congress_id, "шодиева", headers=headers)
    assert (response.status_code, response.json()) == (429, {"detail": "too_many_requests"})


def test_rate_limiter_window_slides(monkeypatch):
    now = [1000.0]
    monkeypatch.setattr(cert_api.time, "monotonic", lambda: now[0])
    limiter = cert_api.RateLimiter()
    assert all(limiter.allow("b", "ip", 2) for _ in range(2))
    assert not limiter.allow("b", "ip", 2)
    now[0] += 61
    assert limiter.allow("b", "ip", 2)


# ==================== admin: доступ ====================

async def test_admin_routes_require_token(client, congress):
    app.dependency_overrides.pop(get_current_admin, None)
    app.dependency_overrides.pop(get_current_admin_user, None)
    calls = [
        client.get(f"{BASE}/congresses/{congress.id}/certificate-settings"),
        client.put(f"{BASE}/congresses/{congress.id}/certificate-settings", json={"is_open": True}),
        client.post(f"{BASE}/congresses/{congress.id}/certificate-template", files={"file": ("a.pdf", TEMPLATE)}),
        client.post(f"{BASE}/congresses/{congress.id}/certificate-preview", json={"name": "X"}),
        client.get(f"{BASE}/congresses/{congress.id}/certificate-recipients"),
        client.post(f"{BASE}/congresses/{congress.id}/certificate-recipients", json={"full_name": "X"}),
        client.put(f"{BASE}/certificate-recipients/1", json={"full_name": "X"}),
        client.delete(f"{BASE}/certificate-recipients/1"),
        client.post(f"{BASE}/certificate-recipients/1/reset"),
        client.post(f"{BASE}/congresses/{congress.id}/certificate-recipients/import", files={"file": ("a.csv", b"x")}),
    ]
    for call in calls:
        response = await call
        assert response.status_code in (401, 403), response.request.url


# ==================== admin: настройки и шаблон ====================

async def test_settings_defaults_without_row(client, congress):
    response = await client.get(f"{BASE}/congresses/{congress.id}/certificate-settings")
    assert response.status_code == 200
    body = response.json()
    assert body["congress_id"] == congress.id
    assert body["has_template"] is False and body["pdf_filename"] is None
    assert (body["font_max_pt"], body["font_min_pt"], body["text_color"], body["is_open"]) == (40, 16, "#1F2937", False)
    assert {"box_x_mm", "box_y_mm", "box_w_mm", "box_h_mm", "updated_at"} <= set(body)
    assert "pdf" not in body


async def test_settings_partial_update(client, congress):
    response = await client.put(
        f"{BASE}/congresses/{congress.id}/certificate-settings",
        json={"box_x_mm": 10, "text_color": "#AA0000"},
    )
    assert response.status_code == 200
    body = response.json()
    assert (body["box_x_mm"], body["text_color"], body["font_max_pt"]) == (10, "#AA0000", 40)
    body = (await client.put(f"{BASE}/congresses/{congress.id}/certificate-settings", json={"font_max_pt": 30})).json()
    assert (body["box_x_mm"], body["font_max_pt"]) == (10, 30)


async def test_settings_validation(client, congress):
    url = f"{BASE}/congresses/{congress.id}/certificate-settings"
    assert (await client.put(url, json={"text_color": "red"})).status_code == 422
    assert (await client.put(url, json={"box_w_mm": 0})).status_code == 422
    assert (await client.put(url, json={"font_min_pt": 50})).status_code == 422  # min > max (40)


async def test_settings_unknown_congress(client):
    assert (await client.get(f"{BASE}/congresses/999/certificate-settings")).status_code == 404


async def test_template_upload(client, congress):
    response = await _upload_template(client, congress.id)
    assert response.status_code == 200
    body = response.json()
    assert body["has_template"] is True and body["pdf_filename"] == "Бланк.pdf"


async def test_template_is_not_published_in_uploads(client, congress, tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    assert (await _upload_template(client, congress.id)).status_code == 200
    assert not (tmp_path / "uploads").exists() or not any((tmp_path / "uploads").iterdir())


async def test_template_rejects_not_pdf(client, congress):
    response = await _upload_template(client, congress.id, b"hello", "a.pdf")
    assert (response.status_code, response.json()) == (400, {"detail": "not_pdf"})
    response = await _upload_template(client, congress.id, b"%PDF-1.4 broken", "a.pdf")
    assert (response.status_code, response.json()) == (400, {"detail": "not_pdf"})


async def test_template_too_large(client, congress, monkeypatch):
    monkeypatch.setattr(cert_api, "MAX_TEMPLATE_SIZE", 100)
    response = await _upload_template(client, congress.id)
    assert (response.status_code, response.json()) == (413, {"detail": "too_large"})


async def test_preview(client, congress, session_factory):
    url = f"{BASE}/congresses/{congress.id}/certificate-preview"
    response = await client.post(url, json={"name": "Пробное Имя"})
    assert (response.status_code, response.json()) == (400, {"detail": "no_template"})

    await _upload_template(client, congress.id)
    recipient = await _add(client, congress.id, "Пробное Имя")
    response = await client.post(url, json={"name": "Пробное Имя"})
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.headers["content-disposition"].startswith("inline")
    assert _squash("Пробное Имя") in _squash(PdfReader(io.BytesIO(response.content)).pages[0].extract_text())
    async with session_factory() as s:
        row = await s.get(CertificateRecipient, recipient["id"])
    assert row.download_count == 0


# ==================== admin: получатели ====================

async def test_recipients_crud(client, congress):
    created = await _add(client, congress.id, "  Алиев   Али ", "+998 (90) 111-22-33")
    assert (created["full_name"], created["phone_digits"], created["download_count"]) == ("Алиев Али", "998901112233", 0)
    assert {"id", "created_at"} <= set(created)

    url = f"{BASE}/certificate-recipients/{created['id']}"
    updated = (await client.put(url, json={"full_name": "Алиева Алия"})).json()
    assert (updated["full_name"], updated["phone_digits"]) == ("Алиева Алия", "998901112233")
    updated = (await client.put(url, json={"phone": None})).json()
    assert updated["phone_digits"] is None

    # поиск по новому имени — name_key пересчитан
    listing = (await client.get(f"{BASE}/congresses/{congress.id}/certificate-recipients", params={"q": "алия"})).json()
    assert [i["id"] for i in listing["items"]] == [created["id"]] and listing["total"] == 1

    assert (await client.delete(url)).json() == {"ok": True}
    assert (await client.put(url, json={"full_name": "X"})).status_code == 404
    assert (await client.delete(url)).status_code == 404


async def test_recipients_list_pagination_and_phone_visible(client, congress):
    for n in range(5):
        await _add(client, congress.id, f"Участник {n}", f"90123456{n}")
    url = f"{BASE}/congresses/{congress.id}/certificate-recipients"
    body = (await client.get(url, params={"skip": 1, "limit": 2})).json()
    assert body["total"] == 5
    assert [i["full_name"] for i in body["items"]] == ["Участник 1", "Участник 2"]
    assert body["items"][0]["phone_digits"] == "901234561"
    assert (await client.get(url, params={"limit": 500})).status_code == 200  # админка грузит страницами до 500
    assert (await client.get(url, params={"limit": 501})).status_code == 422


async def test_reset_counter(client, ready):
    congress_id, _, without_phone = ready
    await _issue(client, congress_id, without_phone["id"])
    response = await client.post(f"{BASE}/certificate-recipients/{without_phone['id']}/reset")
    assert response.status_code == 200 and response.json()["download_count"] == 0
    assert (await client.post(f"{BASE}/certificate-recipients/99999/reset")).status_code == 404


async def test_add_recipient_unknown_congress(client):
    response = await client.post(f"{BASE}/congresses/999/certificate-recipients", json={"full_name": "X"})
    assert response.status_code == 404


# ==================== admin: импорт ====================

CSV = "ФИО;Телефон\nАлиев Али;+998 90 111 22 33\n;\nАлиев Али;+998 90 111 22 33\nKarimov Bobur;\n".encode("cp1251")


async def _import(client, congress_id, data=CSV, mode="append", dry_run=False):
    return await client.post(
        f"{BASE}/congresses/{congress_id}/certificate-recipients/import",
        files={"file": ("list.csv", data, "text/csv")},
        data={"mode": mode, "dry_run": "true" if dry_run else "false"},
    )


async def _names(client, congress_id):
    body = (await client.get(f"{BASE}/congresses/{congress_id}/certificate-recipients", params={"limit": 500})).json()
    return sorted(i["full_name"] for i in body["items"])


async def test_import_dry_run_writes_nothing(client, congress):
    response = await _import(client, congress.id, dry_run=True)
    assert response.status_code == 200, response.text
    assert response.json() == {
        "accepted": 2, "empty_rows": 1, "duplicates_in_file": 1, "skipped_existing": 0,
        "inserted": 0, "sample": ["Алиев Али", "Karimov Bobur"], "columns": ["ФИО", "Телефон"],
    }
    assert await _names(client, congress.id) == []


async def test_import_append_skips_existing(client, congress):
    await _add(client, congress.id, "алиев  али", "+998 90 111 22 33")  # тот же name_key + телефон
    await _add(client, congress.id, "Karimov Bobur", "901234567")  # другой телефон — не тот же
    body = (await _import(client, congress.id)).json()
    assert (body["skipped_existing"], body["inserted"]) == (1, 1)
    assert await _names(client, congress.id) == ["Karimov Bobur", "Karimov Bobur", "алиев али"]


async def test_import_replace_deletes_all(client, ready):
    congress_id, *_ = ready
    await _issue(client, congress_id, ready[2]["id"])
    body = (await _import(client, congress_id, mode="replace")).json()
    assert (body["skipped_existing"], body["inserted"]) == (0, 2)
    listing = (await client.get(f"{BASE}/congresses/{congress_id}/certificate-recipients")).json()
    assert sorted(i["full_name"] for i in listing["items"]) == ["Karimov Bobur", "Алиев Али"]
    assert all(i["download_count"] == 0 for i in listing["items"])


async def test_import_replace_dry_run_keeps_rows(client, ready):
    congress_id, *_ = ready
    assert (await _import(client, congress_id, mode="replace", dry_run=True)).json()["inserted"] == 0
    assert len(await _names(client, congress_id)) == 2


async def test_import_no_name_column(client, congress):
    response = await _import(client, congress.id, "Город;Возраст\nТашкент;30\n".encode())
    assert response.status_code == 400
    assert response.json() == {"detail": {"code": "no_name_column", "columns": ["Город", "Возраст"]}}


async def test_import_bad_mode(client, congress):
    assert (await _import(client, congress.id, mode="merge")).status_code == 422


async def test_import_unknown_congress(client):
    assert (await _import(client, 999)).status_code == 404
