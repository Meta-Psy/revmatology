"""API выдачи сертификатов (К-11): публичная выдача и админские маршруты.

Шаблон грузится через API, не через ORM: так проверяется и сама загрузка.
"""
import io
import re
from urllib.parse import quote

import pytest
from pypdf import PdfReader
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from sqlalchemy import event, select

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


GHOST = {"id": 99999, "full_name": "Нет Такого"}  # получателя с таким id нет
NUMBER_BOX_KEYS = ("number_box_x_mm", "number_box_y_mm", "number_box_w_mm", "number_box_h_mm")
DEFAULT_NAME_BOX = [58, 94, 181, 15]
DEFAULT_NUMBER_BOX = [259, 183, 22, 7]


async def _issue(client, congress_id, recipient, phone=None, headers=None, full_name=None):
    """recipient — ответ _add (id + full_name); full_name подменяет имя из подсказки."""
    return await client.post(
        f"{BASE}/congresses/{congress_id}/certificates/issue",
        json={"recipient_id": recipient["id"], "full_name": full_name or recipient["full_name"], "phone": phone},
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
    response = await _issue(client, congress_id, with_phone, phone)
    assert response.status_code == 200, response.text
    assert response.headers["content-type"] == "application/pdf"
    disposition = response.headers["content-disposition"]
    assert disposition.startswith('attachment; filename="Certificate_Shodieva_Sitora_Bakhodirovna.pdf"')
    assert "filename*=UTF-8''" + quote("Certificate_Шодиева_Ситора_Баходировна.pdf") in disposition
    text = PdfReader(io.BytesIO(response.content)).pages[0].extract_text()
    assert _squash("Шодиева Ситора Баходировна") in _squash(text)
    assert with_phone["number"] == 1 and "001" in text


async def test_issue_wrong_or_missing_phone_is_404(client, ready):
    congress_id, with_phone, _ = ready
    for phone in ["+998 91 123 45 67", None, "", "1234567"]:
        response = await _issue(client, congress_id, with_phone, phone)
        assert (response.status_code, response.json()) == (404, {"detail": "not_found"}), phone


async def test_issue_without_phone_in_list(client, ready):
    congress_id, _, without_phone = ready
    response = await _issue(client, congress_id, without_phone)
    assert response.status_code == 200
    assert 'filename="Certificate_Karimov_Bobur.pdf"' in response.headers["content-disposition"]
    assert "002" in PdfReader(io.BytesIO(response.content)).pages[0].extract_text()


async def test_issue_without_number_box_prints_no_number(client, ready):
    congress_id, _, without_phone = ready
    await client.put(f"{BASE}/congresses/{congress_id}/certificate-settings", json={k: None for k in NUMBER_BOX_KEYS})
    response = await _issue(client, congress_id, without_phone)
    assert response.status_code == 200
    assert "002" not in PdfReader(io.BytesIO(response.content)).pages[0].extract_text()


async def test_issue_other_congress_is_404(client, ready, make_congress):
    congress_id, _, without_phone = ready
    other = await make_congress("Другой")
    assert (await _upload_template(client, other.id)).status_code == 200
    await _open(client, other.id)
    response = await _issue(client, other.id, without_phone)
    assert (response.status_code, response.json()) == (404, {"detail": "not_found"})
    assert (await _issue(client, congress_id, GHOST)).status_code == 404


async def test_issue_closed_is_404(client, ready):
    congress_id, _, without_phone = ready
    await _open(client, congress_id, False)
    response = await _issue(client, congress_id, without_phone)
    assert (response.status_code, response.json()) == (404, {"detail": "not_found"})


async def test_issue_requires_matching_name(client, ready, session_factory):
    """Перебор id не даёт PDF: имя из подсказки должно совпасть с именем получателя."""
    congress_id, with_phone, without_phone = ready
    for name in ["Шодиева Ситора Баходировна", "Karimov", "Karimov Boburjon"]:
        response = await _issue(client, congress_id, without_phone, full_name=name)
        assert (response.status_code, response.json()) == (404, {"detail": "not_found"}), name
    # верный телефон, но чужое имя — тоже 404
    response = await _issue(client, congress_id, with_phone, "901234567", full_name="Karimov Bobur")
    assert response.status_code == 404
    async with session_factory() as s:
        counts = (await s.execute(select(CertificateRecipient.download_count))).scalars().all()
    assert counts == [0, 0]  # 404 — до списания


async def test_issue_name_is_normalized(client, ready):
    congress_id, _, without_phone = ready
    response = await _issue(client, congress_id, without_phone, full_name="  karimov   BOBUR ")
    assert response.status_code == 200, response.text


async def test_issue_name_validation(client, ready):
    congress_id, _, without_phone = ready
    url = f"{BASE}/congresses/{congress_id}/certificates/issue"
    assert (await client.post(url, json={"recipient_id": without_phone["id"]})).status_code == 422
    too_long = {"recipient_id": without_phone["id"], "full_name": "А" * 301}
    assert (await client.post(url, json=too_long)).status_code == 422


def _selects_pdf(statement: str) -> bool:
    """В списке выбираемых колонок есть байты шаблона (WHERE ... pdf IS NOT NULL — не в счёт)."""
    head = re.split(r"\sFROM\s", statement, maxsplit=1)[0]
    return statement.lstrip().upper().startswith("SELECT") and re.search(r"certificate_templates\.pdf\b", head) is not None


@pytest.fixture
def statements(engine):
    seen: list[str] = []

    def _record(conn, cursor, statement, parameters, context, executemany):
        seen.append(statement)

    event.listen(engine.sync_engine, "before_cursor_execute", _record)
    yield seen
    event.remove(engine.sync_engine, "before_cursor_execute", _record)


async def test_issue_reads_pdf_only_after_charge(client, ready, statements):
    congress_id, _, without_phone = ready
    statements.clear()
    assert (await _issue(client, congress_id, without_phone, full_name="Чужое Имя")).status_code == 404
    assert not any(_selects_pdf(s) for s in statements), statements

    for _ in range(cert_api.MAX_DOWNLOADS - 1):
        assert (await _issue(client, congress_id, without_phone)).status_code == 200
    statements.clear()
    assert (await _issue(client, congress_id, without_phone)).status_code == 200
    charge = next(i for i, s in enumerate(statements) if s.lstrip().upper().startswith("UPDATE CERTIFICATE_RECIPIENTS"))
    pdf_reads = [i for i, s in enumerate(statements) if _selects_pdf(s)]
    assert pdf_reads and min(pdf_reads) > charge, statements

    statements.clear()
    assert (await _issue(client, congress_id, without_phone)).status_code == 403
    assert not any(_selects_pdf(s) for s in statements), statements


async def test_sixth_issue_is_403(client, ready, session_factory):
    congress_id, _, without_phone = ready
    for _ in range(cert_api.MAX_DOWNLOADS):
        assert (await _issue(client, congress_id, without_phone)).status_code == 200
    response = await _issue(client, congress_id, without_phone)
    assert (response.status_code, response.json()) == (403, {"detail": "limit_reached"})
    async with session_factory() as s:
        row = (await s.execute(select(CertificateRecipient).where(CertificateRecipient.id == without_phone["id"]))).scalar_one()
    assert row.download_count == 5


async def test_render_failure_returns_counter(client, ready, monkeypatch, session_factory):
    congress_id, _, without_phone = ready

    def _boom(*args, **kwargs):
        raise RuntimeError("broken")

    monkeypatch.setattr(cert_api, "render_certificate", _boom)
    response = await _issue(client, congress_id, without_phone)
    assert response.status_code == 500
    async with session_factory() as s:
        row = (await s.execute(select(CertificateRecipient).where(CertificateRecipient.id == without_phone["id"]))).scalar_one()
    assert row.download_count == 0


async def test_issue_rate_limit(client, ready):
    congress_id, _, without_phone = ready
    headers = {"X-Real-IP": "10.0.0.1"}
    for _ in range(cert_api.ISSUE_PER_MINUTE):
        assert (await _issue(client, congress_id, GHOST, headers=headers)).status_code == 404
    response = await _issue(client, congress_id, without_phone, headers=headers)
    assert (response.status_code, response.json()) == (429, {"detail": "too_many_requests"})
    # другой IP — своё окно
    assert (await _issue(client, congress_id, without_phone, headers={"X-Real-IP": "10.0.0.2"})).status_code == 200


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


def test_rate_limiter_forgets_idle_ips(monkeypatch):
    """Ключ IP удаляется, когда его окно опустело, — словарь не растёт бесконечно."""
    now = [1000.0]
    monkeypatch.setattr(cert_api.time, "monotonic", lambda: now[0])
    limiter = cert_api.RateLimiter()
    for n in range(100):
        assert limiter.allow("b", f"10.0.0.{n}", 5)
    now[0] += 61
    assert limiter.allow("b", "fresh", 5)
    assert set(limiter._hits) == {"b:fresh"}


def test_rate_limits_fit_shared_ip():
    """На площадке и у операторов с CGNAT за одним IP много людей."""
    assert (cert_api.SUGGEST_PER_MINUTE, cert_api.ISSUE_PER_MINUTE) == (60, 20)


async def test_suggest_query_length_limit(client, ready):
    congress_id, *_ = ready
    assert (await _suggest(client, congress_id, "ш" * 200)).status_code == 200
    assert (await _suggest(client, congress_id, "ш" * 201)).status_code == 422


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
    assert (body["font_max_pt"], body["font_min_pt"], body["text_color"], body["is_open"]) == (40, 16, "#1B3A7A", False)
    # под бланк организаторов (A4 альбомный): линия под «of participation» и «No. ____»
    assert [body[k] for k in ("box_x_mm", "box_y_mm", "box_w_mm", "box_h_mm")] == DEFAULT_NAME_BOX
    assert [body[k] for k in NUMBER_BOX_KEYS] == DEFAULT_NUMBER_BOX
    assert body["number_font_pt"] == 14
    assert "updated_at" in body
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


async def test_settings_number_box_can_be_cleared(client, congress):
    url = f"{BASE}/congresses/{congress.id}/certificate-settings"
    body = (await client.put(url, json={k: None for k in NUMBER_BOX_KEYS})).json()
    assert [body[k] for k in NUMBER_BOX_KEYS] == [None] * 4
    # null у рамки имени по-прежнему «не менять»
    assert (await client.put(url, json={"box_x_mm": None})).json()["box_x_mm"] == DEFAULT_NAME_BOX[0]
    body = (await client.put(url, json={"number_box_x_mm": 250, "number_box_y_mm": 180,
                                        "number_box_w_mm": 30, "number_box_h_mm": 8, "number_font_pt": 12})).json()
    assert [body[k] for k in (*NUMBER_BOX_KEYS, "number_font_pt")] == [250, 180, 30, 8, 12]


async def test_settings_number_box_all_or_nothing(client, congress):
    url = f"{BASE}/congresses/{congress.id}/certificate-settings"
    response = await client.put(url, json={"number_box_w_mm": None})
    assert (response.status_code, response.json()) == (422, {"detail": "number_box_incomplete"})
    body = (await client.get(url)).json()
    assert [body[k] for k in NUMBER_BOX_KEYS] == DEFAULT_NUMBER_BOX  # ничего не сохранилось
    assert (await client.put(url, json={"number_box_w_mm": 0})).status_code == 422
    assert (await client.put(url, json={"number_font_pt": 0})).status_code == 422
    assert (await client.put(url, json={"number_font_pt": None})).json()["number_font_pt"] == 14


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
    text = PdfReader(io.BytesIO(response.content)).pages[0].extract_text()
    assert _squash("Пробное Имя") in _squash(text)
    assert "000" in text  # пробный номер
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
    await _issue(client, congress_id, without_phone)
    response = await client.post(f"{BASE}/certificate-recipients/{without_phone['id']}/reset")
    assert response.status_code == 200 and response.json()["download_count"] == 0
    assert (await client.post(f"{BASE}/certificate-recipients/99999/reset")).status_code == 404


@pytest.mark.parametrize("phone", ["1234", "12345678", "+998 90 123 45 67, +998 91 765 43 21"])
async def test_recipient_bad_phone_is_422(client, congress, phone):
    url = f"{BASE}/congresses/{congress.id}/certificate-recipients"
    response = await client.post(url, json={"full_name": "Алиев Али", "phone": phone})
    assert (response.status_code, response.json()) == (422, {"detail": "invalid_phone"})
    created = await _add(client, congress.id, "Алиев Али", "901234567")
    response = await client.put(f"{BASE}/certificate-recipients/{created['id']}", json={"phone": phone})
    assert (response.status_code, response.json()) == (422, {"detail": "invalid_phone"})
    listing = (await client.get(url)).json()
    assert [(i["full_name"], i["phone_digits"]) for i in listing["items"]] == [("Алиев Али", "901234567")]


async def test_recipient_empty_phone_means_none(client, congress):
    created = await _add(client, congress.id, "Алиев Али", " - ")
    assert created["phone_digits"] is None
    updated = await client.put(f"{BASE}/certificate-recipients/{created['id']}", json={"phone": ""})
    assert updated.status_code == 200 and updated.json()["phone_digits"] is None


async def test_recipient_too_long_name_is_422(client, congress):
    url = f"{BASE}/congresses/{congress.id}/certificate-recipients"
    assert (await client.post(url, json={"full_name": "А" * 301})).status_code == 422
    created = await _add(client, congress.id, "А" * 300)
    response = await client.put(f"{BASE}/certificate-recipients/{created['id']}", json={"full_name": "А" * 301})
    assert response.status_code == 422


async def test_add_recipient_unknown_congress(client):
    response = await client.post(f"{BASE}/congresses/999/certificate-recipients", json={"full_name": "X"})
    assert response.status_code == 404


# ==================== admin: порядковые номера ====================

async def _numbers(client, congress_id):
    body = (await client.get(f"{BASE}/congresses/{congress_id}/certificate-recipients", params={"limit": 500})).json()
    return [(i["number"], i["full_name"]) for i in body["items"]]


async def test_numbers_assigned_in_order_and_permanent(client, ready):
    congress_id, with_phone, without_phone = ready
    third = await _add(client, congress_id, "Алиев Али")
    assert (with_phone["number"], without_phone["number"], third["number"]) == (1, 2, 3)
    # список — по номеру, а не по алфавиту
    assert await _numbers(client, congress_id) == [
        (1, "Шодиева Ситора Баходировна"), (2, "Karimov Bobur"), (3, "Алиев Али"),
    ]
    # правка и сброс счётчика номер не меняют
    url = f"{BASE}/certificate-recipients/{without_phone['id']}"
    assert (await client.put(url, json={"full_name": "Karimov Bobur Aliyevich"})).json()["number"] == 2
    await _issue(client, congress_id, third)
    assert (await client.post(f"{BASE}/certificate-recipients/{third['id']}/reset")).json()["number"] == 3
    # удаление оставляет дырку
    await client.delete(url)
    assert (await _add(client, congress_id, "Новый Участник"))["number"] == 4
    assert [n for n, _ in await _numbers(client, congress_id)] == [1, 3, 4]


async def test_deleted_last_number_is_not_reissued(client, ready):
    """Удалённый мог уже скачать сертификат со своим номером — номер не выдаётся повторно."""
    congress_id, _, last = ready
    await client.delete(f"{BASE}/certificate-recipients/{last['id']}")
    assert (await _add(client, congress_id, "Новый Участник"))["number"] == 3
    assert [n for n, _ in await _numbers(client, congress_id)] == [1, 3]


async def test_numbers_are_per_congress(client, ready, make_congress):
    other = await make_congress("Другой")
    assert (await _add(client, other.id, "Алиев Али"))["number"] == 1


async def test_number_conflict_is_409(client, ready, monkeypatch):
    """Редкая гонка двух вставок: уникальный индекс ловит одинаковый номер."""
    congress_id, *_ = ready

    async def _taken(db, cid, count=1, restart=False):
        return 1

    monkeypatch.setattr(cert_api, "_next_number", _taken)
    response = await client.post(f"{BASE}/congresses/{congress_id}/certificate-recipients", json={"full_name": "Гонка"})
    assert (response.status_code, response.json()) == (409, {"detail": "number_conflict"})
    response = await _import(client, congress_id)
    assert (response.status_code, response.json()) == (409, {"detail": "number_conflict"})
    assert len(await _numbers(client, congress_id)) == 2


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
        "short_phones": 0, "invalid_phones": 0, "too_long_names": 0, "will_insert": 2,
        "inserted": 0, "sample": ["Алиев Али", "Karimov Bobur"], "columns": ["ФИО", "Телефон"],
        "numbering_restarted": False, "first_number": 1,
    }
    assert await _names(client, congress.id) == []


async def test_import_append_skips_existing(client, congress):
    await _add(client, congress.id, "алиев  али", "+998 90 111 22 33")  # тот же name_key + телефон
    await _add(client, congress.id, "Karimov Bobur", "901234567")  # другой телефон — не тот же
    dry = (await _import(client, congress.id, dry_run=True)).json()
    body = (await _import(client, congress.id)).json()
    assert (body["skipped_existing"], body["will_insert"], body["inserted"]) == (1, 1, 1)
    assert dry["will_insert"] == body["will_insert"]
    assert await _names(client, congress.id) == ["Karimov Bobur", "Karimov Bobur", "алиев али"]
    assert (await _numbers(client, congress.id))[-1] == (3, "Karimov Bobur")  # продолжает нумерацию


async def test_import_numbers_follow_file_order(client, congress):
    data = "ФИО\nЯковлев Яков\nАлиев Али\nMirzayev Olim\n".encode()
    await _import(client, congress.id, data)
    assert await _numbers(client, congress.id) == [(1, "Яковлев Яков"), (2, "Алиев Али"), (3, "Mirzayev Olim")]


# колонки: имя String(300), телефон String(20) — PostgreSQL на лишнем падает 500
BAD_CSV = (
    "ФИО;Телефон\n"
    f"{'Д' * 301};901234567\n"
    "Алиев Али;12-34\n"
    "Karimov Bobur;+998 90 123 45 67 / +998 91 765 43 21\n"
    "Шодиева Ситора;+998 90 555 44 33\n"
).encode()


async def test_import_counts_bad_values_same_in_dry_run(client, congress):
    dry = (await _import(client, congress.id, BAD_CSV, dry_run=True)).json()
    body = (await _import(client, congress.id, BAD_CSV)).json()
    counters = ("accepted", "short_phones", "invalid_phones", "too_long_names", "will_insert")
    assert [dry[k] for k in counters] == [body[k] for k in counters] == [3, 1, 1, 1, 3]
    assert (dry["inserted"], body["inserted"]) == (0, 3)
    listing = (await client.get(f"{BASE}/congresses/{congress.id}/certificate-recipients")).json()
    assert sorted((i["full_name"], i["phone_digits"]) for i in listing["items"]) == [
        ("Karimov Bobur", None), ("Алиев Али", None), ("Шодиева Ситора", "998905554433"),
    ]


async def test_import_replace_with_empty_list_is_refused(client, ready):
    congress_id, *_ = ready
    empty = "ФИО;Телефон\n;\n".encode()
    response = await _import(client, congress_id, empty, mode="replace")
    assert (response.status_code, response.json()) == (400, {"detail": "empty_replace"})
    assert len(await _names(client, congress_id)) == 2  # никто не удалён
    dry = await _import(client, congress_id, empty, mode="replace", dry_run=True)
    assert dry.status_code == 200 and dry.json()["will_insert"] == 0


async def test_import_replace_deletes_all(client, ready):
    congress_id, *_ = ready
    dry = (await _import(client, congress_id, mode="replace", dry_run=True)).json()
    assert (dry["numbering_restarted"], dry["first_number"]) == (True, 1)
    body = (await _import(client, congress_id, mode="replace")).json()
    assert (body["skipped_existing"], body["will_insert"], body["inserted"]) == (0, 2, 2)
    assert (body["numbering_restarted"], body["first_number"]) == (True, 1)
    listing = (await client.get(f"{BASE}/congresses/{congress_id}/certificate-recipients")).json()
    assert sorted(i["full_name"] for i in listing["items"]) == ["Karimov Bobur", "Алиев Али"]
    # никто не скачивал — нумерация заново с 1
    assert await _numbers(client, congress_id) == [(1, "Алиев Али"), (2, "Karimov Bobur")]
    assert (await _add(client, congress_id, "Новый Участник"))["number"] == 3


async def test_import_replace_after_download_continues_numbering(client, ready):
    """Скачанный сертификат уже несёт номер — после replace номера не повторяются."""
    congress_id, *_ = ready
    await _issue(client, congress_id, ready[2])
    dry = (await _import(client, congress_id, mode="replace", dry_run=True)).json()
    assert (dry["numbering_restarted"], dry["first_number"]) == (False, 3)
    body = (await _import(client, congress_id, mode="replace")).json()
    assert (body["inserted"], body["numbering_restarted"], body["first_number"]) == (2, False, 3)
    listing = (await client.get(f"{BASE}/congresses/{congress_id}/certificate-recipients")).json()
    assert all(i["download_count"] == 0 for i in listing["items"])
    assert await _numbers(client, congress_id) == [(3, "Алиев Али"), (4, "Karimov Bobur")]


async def test_import_append_reports_first_number(client, ready):
    congress_id, *_ = ready
    dry = (await _import(client, congress_id, dry_run=True)).json()
    body = (await _import(client, congress_id)).json()
    assert (dry["numbering_restarted"], dry["first_number"]) == (False, 3)
    assert (body["numbering_restarted"], body["first_number"]) == (False, 3)


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
