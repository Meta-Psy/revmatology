"""Сертификаты в личном кабинете и импорт получателей из регистраций (К-12).

Design-doc _specs/2026-09-22-certificates-account-design.md §4–§5.
"""
import io
from datetime import date, datetime

import pytest
from pypdf import PdfReader
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas

from api import certificates as cert_api
from database.models import User, UserRole
from functions.auth import create_access_token

BASE = "/api/congress"
MINE = f"{BASE}/my-certificates"
TODAY = date(2026, 9, 26)
CONGRESS_END = datetime(2026, 9, 25, 18, 0)


def _template_pdf() -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=landscape(A4))
    c.drawString(72, 500, "CERTIFICATE")
    c.showPage()
    c.save()
    return buf.getvalue()


TEMPLATE = _template_pdf()


@pytest.fixture(autouse=True)
def today(monkeypatch):
    """«Сегодня» в Ташкенте — на следующий день после окончания конгресса."""
    monkeypatch.setattr(cert_api, "_today", lambda: TODAY)


@pytest.fixture
async def account(db_session):
    """Фабрика учётных записей: возвращает (пользователь, заголовки с токеном)."""
    async def _make(email="ivan@mail.ru", last_name="Иванов", first_name="Иван"):
        user = User(
            email=email, hashed_password="not-a-real-hash",
            last_name=last_name, first_name=first_name, role=UserRole.USER, is_active=True,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        token = create_access_token({"sub": user.email, "role": "user"})
        return user, {"Authorization": f"Bearer {token}"}

    return _make


async def _set_end(client, congress_id, date_end=CONGRESS_END):
    response = await client.put(
        f"{BASE}/congresses/{congress_id}",
        json={"date_end": date_end.isoformat() if date_end else None},
    )
    assert response.status_code == 200, response.text
    return response


async def _upload_template(client, congress_id):
    response = await client.post(
        f"{BASE}/congresses/{congress_id}/certificate-template",
        files={"file": ("Бланк.pdf", TEMPLATE, "application/pdf")},
    )
    assert response.status_code == 200, response.text


async def _add(client, congress_id, full_name, phone=None, email=None):
    response = await client.post(
        f"{BASE}/congresses/{congress_id}/certificate-recipients",
        json={"full_name": full_name, "phone": phone, "email": email},
    )
    assert response.status_code == 200, response.text
    return response.json()


@pytest.fixture
async def ready(client, congress):
    """Конгресс с бланком, вчерашним окончанием (выдача открылась сама) и получателем."""
    await _set_end(client, congress.id)
    await _upload_template(client, congress.id)
    mine = await _add(client, congress.id, "Иванов Иван Иванович", email="Ivan@Mail.RU")
    await _add(client, congress.id, "Karimov Bobur", email="bobur@mail.uz")
    return congress.id, mine


# ==================== кабинет: список ====================

async def test_my_certificates_shows_only_mine(client, ready, account):
    congress_id, mine = ready
    _, headers = await account()

    response = await client.get(MINE, headers=headers)

    assert response.status_code == 200, response.text
    assert response.json() == [{
        "recipient_id": mine["id"], "congress_id": congress_id,
        "congress_title_ru": "Тестовый конгресс", "congress_title_uz": "Тестовый конгресс",
        "congress_title_en": "Тестовый конгресс",
        "full_name": "Иванов Иван Иванович", "number": 1, "downloads_left": 5,
        "open": True, "opens_on": None,
    }]


async def test_my_certificates_has_no_phones(client, ready, account):
    congress_id, mine = ready
    await client.put(f"{BASE}/certificate-recipients/{mine['id']}", json={"phone": "+998 90 123 45 67"})
    _, headers = await account()

    response = await client.get(MINE, headers=headers)

    assert "998" not in response.text, response.text


async def test_my_certificates_match_is_case_insensitive(client, ready, account):
    """Почта получателя и учётной записи сравниваются без регистра и пробелов."""
    _, headers = await account(email="IVAN@mail.ru")
    body = (await client.get(MINE, headers=headers)).json()
    assert [item["full_name"] for item in body] == ["Иванов Иван Иванович"]


async def test_my_certificates_empty_for_other_email(client, ready, account):
    _, headers = await account(email="petr@mail.ru")
    assert (await client.get(MINE, headers=headers)).json() == []


async def test_my_certificates_requires_token(client, ready):
    assert (await client.get(MINE)).status_code == 401


async def test_my_certificates_fresh_congresses_first(client, ready, account, make_congress):
    congress_id, _ = ready
    older = await make_congress("Прошлогодний")
    await _set_end(client, older.id, datetime(2025, 9, 25, 18, 0))
    await _upload_template(client, older.id)
    await _add(client, older.id, "Иванов Иван Иванович", email="ivan@mail.ru")
    await client.put(f"{BASE}/congresses/{congress_id}", json={"date_start": "2026-09-23T09:00:00"})
    await client.put(f"{BASE}/congresses/{older.id}", json={"date_start": "2025-09-23T09:00:00"})
    _, headers = await account()

    body = (await client.get(MINE, headers=headers)).json()

    assert [item["congress_id"] for item in body] == [congress_id, older.id]


async def test_my_certificates_closed_shows_opens_on(client, client_settings_mode, ready, account):
    """До окончания конгресса выдача закрыта, но дата открытия известна."""
    congress_id, _ = ready
    await client_settings_mode(congress_id, "auto")
    future_end = datetime(2026, 10, 10, 18, 0)
    await _set_end(client, congress_id, future_end)
    _, headers = await account()

    body = (await client.get(MINE, headers=headers)).json()

    assert (body[0]["open"], body[0]["opens_on"]) == (False, "2026-10-11")


@pytest.fixture
def client_settings_mode(client):
    async def _set(congress_id, mode):
        response = await client.put(
            f"{BASE}/congresses/{congress_id}/certificate-settings", json={"issue_mode": mode}
        )
        assert response.status_code == 200, response.text
        return response.json()

    return _set


# ==================== кабинет: скачивание ====================

async def _download(client, recipient_id, headers=None):
    return await client.post(f"{MINE}/{recipient_id}/download", headers=headers)


async def test_download_my_certificate(client, ready, account):
    congress_id, mine = ready
    _, headers = await account()

    response = await _download(client, mine["id"], headers)

    assert response.status_code == 200, response.text
    assert response.headers["content-type"] == "application/pdf"
    assert 'filename="Certificate_Ivanov_Ivan_Ivanovich.pdf"' in response.headers["content-disposition"]
    text = PdfReader(io.BytesIO(response.content)).pages[0].extract_text()
    assert "".join("Иванов Иван Иванович".split()) in "".join(text.split())
    assert "001" in text
    body = (await client.get(MINE, headers=headers)).json()
    assert body[0]["downloads_left"] == 4


async def test_download_foreign_certificate_is_404(client, ready, account):
    congress_id, _ = ready
    listing = (await client.get(f"{BASE}/congresses/{congress_id}/certificate-recipients")).json()
    foreign = next(i for i in listing["items"] if i["full_name"] == "Karimov Bobur")
    _, headers = await account()

    response = await _download(client, foreign["id"], headers)

    assert (response.status_code, response.json()) == (404, {"detail": "not_found"})
    listing = (await client.get(f"{BASE}/congresses/{congress_id}/certificate-recipients")).json()
    assert all(i["download_count"] == 0 for i in listing["items"])


async def test_download_unknown_recipient_is_404(client, ready, account):
    _, headers = await account()
    assert (await _download(client, 99999, headers)).status_code == 404


async def test_download_closed_is_404(client, ready, account, client_settings_mode):
    congress_id, mine = ready
    await client_settings_mode(congress_id, "closed")
    _, headers = await account()

    response = await _download(client, mine["id"], headers)

    assert (response.status_code, response.json()) == (404, {"detail": "not_found"})


async def test_download_before_the_end_is_404(client, ready, account):
    """Режим auto: пока конгресс не кончился, кабинет сертификат не отдаёт."""
    congress_id, mine = ready
    await _set_end(client, congress_id, datetime(2026, 10, 10, 18, 0))
    _, headers = await account()

    assert (await _download(client, mine["id"], headers)).status_code == 404


async def test_download_limit_is_shared_with_public_issue(client, ready, account):
    congress_id, mine = ready
    _, headers = await account()
    for _ in range(cert_api.MAX_DOWNLOADS - 1):
        assert (await _download(client, mine["id"], headers)).status_code == 200
    # пятая — через публичную страницу поиска: ведро одно
    issued = await client.post(
        f"{BASE}/congresses/{congress_id}/certificates/issue",
        json={"recipient_id": mine["id"], "full_name": mine["full_name"]},
    )
    assert issued.status_code == 200, issued.text

    response = await _download(client, mine["id"], headers)

    assert (response.status_code, response.json()) == (403, {"detail": "limit_reached"})
    assert (await client.get(MINE, headers=headers)).json()[0]["downloads_left"] == 0


async def test_download_requires_token(client, ready):
    _, mine = ready
    assert (await _download(client, mine["id"])).status_code == 401


async def test_download_render_failure_returns_counter(client, ready, account, monkeypatch):
    congress_id, mine = ready
    _, headers = await account()

    def _boom(*args, **kwargs):
        raise RuntimeError("broken")

    monkeypatch.setattr(cert_api, "render_certificate", _boom)
    assert (await _download(client, mine["id"], headers)).status_code == 500
    monkeypatch.undo()
    assert (await client.get(MINE, headers=headers)).json()[0]["downloads_left"] == 5


async def test_download_rate_limited_with_issue(client, ready, account):
    congress_id, mine = ready
    _, headers = await account()
    headers = {**headers, "X-Real-IP": "10.0.0.7"}
    for _ in range(cert_api.ISSUE_PER_MINUTE):
        await _download(client, 99999, headers)

    response = await _download(client, mine["id"], headers)

    assert (response.status_code, response.json()) == (429, {"detail": "too_many_requests"})


# ==================== импорт из регистраций ====================

async def _register(client, congress_id, last_name, first_name, patronymic=None, email="a@mail.ru", phone=None):
    response = await client.post(
        f"{BASE}/{congress_id}/register",
        json={"congress_id": congress_id, "last_name": last_name, "first_name": first_name,
              "patronymic": patronymic, "email": email, "phone": phone},
    )
    assert response.status_code == 200, response.text
    return response.json()


async def _import_registrations(client, congress_id, mode="append", dry_run=False):
    return await client.post(
        f"{BASE}/congresses/{congress_id}/certificate-recipients/import-registrations",
        data={"mode": mode, "dry_run": "true" if dry_run else "false"},
    )


async def _recipients(client, congress_id):
    body = (await client.get(f"{BASE}/congresses/{congress_id}/certificate-recipients",
                             params={"limit": 500})).json()
    return [(i["number"], i["full_name"], i["phone_digits"], i["email"]) for i in body["items"]]


@pytest.fixture
async def registered(client, congress):
    await _register(client, congress.id, "Шодиева", "Ситора", "Баходировна",
                    email="Sitora@Mail.UZ", phone="+998 90 123 45 67")
    await _register(client, congress.id, "Karimov", "Bobur", email="bobur@mail.uz")
    return congress.id


async def test_import_registrations_dry_run_writes_nothing(client, registered):
    response = await _import_registrations(client, registered, dry_run=True)

    assert response.status_code == 200, response.text
    assert response.json() == {
        "accepted": 2, "empty_rows": 0, "duplicates_in_file": 0, "skipped_existing": 0,
        "short_phones": 0, "invalid_phones": 0, "too_long_names": 0, "will_insert": 2,
        "inserted": 0, "sample": ["Шодиева Ситора Баходировна", "Karimov Bobur"],
        "columns": [], "numbering_restarted": False, "first_number": 1,
    }
    assert await _recipients(client, registered) == []


async def test_import_registrations_writes_names_phones_emails(client, registered):
    """Ф.И.О. — «Фамилия Имя Отчество», без отчества — две части; пустой телефон — None."""
    response = await _import_registrations(client, registered)

    assert response.json()["inserted"] == 2
    assert await _recipients(client, registered) == [
        (1, "Шодиева Ситора Баходировна", "998901234567", "sitora@mail.uz"),
        (2, "Karimov Bobur", None, "bobur@mail.uz"),
    ]


async def test_import_registrations_append_skips_existing(client, registered):
    await _import_registrations(client, registered)
    await _register(client, registered, "Алиев", "Али", email="ali@mail.ru")

    body = (await _import_registrations(client, registered)).json()

    assert (body["skipped_existing"], body["will_insert"], body["inserted"]) == (2, 1, 1)
    assert [n for n, *_ in await _recipients(client, registered)] == [1, 2, 3]


async def test_import_registrations_replace_restarts_numbering(client, registered):
    await _import_registrations(client, registered)

    body = (await _import_registrations(client, registered, mode="replace")).json()

    assert (body["inserted"], body["numbering_restarted"], body["first_number"]) == (2, True, 1)
    assert [n for n, *_ in await _recipients(client, registered)] == [1, 2]


async def test_import_registrations_empty_replace_is_refused(client, congress):
    response = await _import_registrations(client, congress.id, mode="replace")
    assert (response.status_code, response.json()) == (400, {"detail": "empty_replace"})


async def test_import_registrations_other_congress_not_taken(client, registered, make_congress):
    other = await make_congress("Другой")
    assert (await _import_registrations(client, other.id, dry_run=True)).json()["will_insert"] == 0


async def test_import_registrations_unknown_congress(client):
    assert (await _import_registrations(client, 999)).status_code == 404


async def test_import_registrations_requires_admin(client, registered):
    from functions.auth import get_current_admin, get_current_admin_user
    from main import app
    app.dependency_overrides.pop(get_current_admin, None)
    app.dependency_overrides.pop(get_current_admin_user, None)
    assert (await _import_registrations(client, registered)).status_code in (401, 403)


async def test_registered_participant_reaches_his_certificate(client, registered, account):
    """Импорт из регистраций → та же почта в кабинете → сертификат с именем из регистрации."""
    await _set_end(client, registered)
    await _upload_template(client, registered)
    await _import_registrations(client, registered)
    _, headers = await account(email="sitora@mail.uz")

    body = (await client.get(MINE, headers=headers)).json()
    assert [(item["full_name"], item["open"]) for item in body] == [("Шодиева Ситора Баходировна", True)]
    pdf = await _download(client, body[0]["recipient_id"], headers)
    assert pdf.status_code == 200, pdf.text


# ==================== email у получателя ====================

async def test_recipient_email_is_normalized(client, congress):
    created = await _add(client, congress.id, "Алиев Али", email="  Ali@Mail.RU ")
    assert created["email"] == "ali@mail.ru"
    updated = await client.put(f"{BASE}/certificate-recipients/{created['id']}", json={"email": "NEW@mail.ru"})
    assert updated.json()["email"] == "new@mail.ru"


async def test_recipient_email_can_be_cleared(client, congress):
    created = await _add(client, congress.id, "Алиев Али", email="ali@mail.ru")
    updated = await client.put(f"{BASE}/certificate-recipients/{created['id']}", json={"email": ""})
    assert (updated.status_code, updated.json()["email"]) == (200, None)


@pytest.mark.parametrize("email", ["не-почта", "ali(at)mail.ru"])
async def test_recipient_bad_email_is_422(client, congress, email):
    url = f"{BASE}/congresses/{congress.id}/certificate-recipients"
    response = await client.post(url, json={"full_name": "Алиев Али", "email": email})
    assert (response.status_code, response.json()) == (422, {"detail": "invalid_email"})
    created = await _add(client, congress.id, "Алиев Али")
    response = await client.put(f"{BASE}/certificate-recipients/{created['id']}", json={"email": email})
    assert (response.status_code, response.json()) == (422, {"detail": "invalid_email"})
    assert (await client.get(url)).json()["items"][0]["email"] is None


async def test_csv_import_stores_email(client, congress):
    data = "ФИО;Телефон;Эл. почта\nАлиев Али;901234567;Ali@Mail.RU\n".encode()
    response = await client.post(
        f"{BASE}/congresses/{congress.id}/certificate-recipients/import",
        files={"file": ("list.csv", data, "text/csv")},
        data={"mode": "append", "dry_run": "false"},
    )
    assert response.status_code == 200, response.text
    assert await _recipients(client, congress.id) == [(1, "Алиев Али", "901234567", "ali@mail.ru")]
