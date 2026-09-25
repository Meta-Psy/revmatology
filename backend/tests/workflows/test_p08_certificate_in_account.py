"""P-08: участник забирает сертификат в личном кабинете (К-12).

Правило голой базы: состояние строится только через HTTP (`client`), никаких
ORM-фабрик. Снаружи подменяется одно — «сегодня» по Ташкенту: иначе прогон
зависел бы от дня, в который его запустили.
"""
import io
from datetime import date

from pypdf import PdfReader
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas

from api import certificates as cert_api

PROCESS_ID = "P-08"
BASE = "/api/congress"
EMAIL = "Sitora@Mail.UZ"
OFFICIAL_NAME = "Шодиева Ситора Баходировна"
CONGRESS_END = "2026-09-25T18:00:00"
LAST_DAY = date(2026, 9, 25)
DAY_AFTER = date(2026, 9, 26)


def _blank_certificate() -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=landscape(A4))
    c.setFont("Helvetica", 36)
    c.drawCentredString(421, 480, "CERTIFICATE")
    c.showPage()
    c.save()
    return buf.getvalue()


def _squash(text: str) -> str:
    return "".join(text.split()).casefold()


async def test_p08(journey, client, monkeypatch):
    j = journey(PROCESS_ID)
    monkeypatch.setattr(cert_api, "_today", lambda: LAST_DAY)  # конгресс ещё идёт

    # --- create_congress -----------------------------------------------------
    created = await j.step(
        "create_congress",
        lambda: client.post(
            f"{BASE}/congresses",
            json={"title_ru": "XII съезд ревматологов", "title_uz": "Revmatologlar XII qurultoyi",
                  "title_en": "12th Congress of Rheumatologists", "date_end": CONGRESS_END},
        ),
    )
    assert created.status_code == 200, f"[create_congress] {created.status_code}: {created.text}"
    congress_id = created.json()["id"]

    # --- register_participant ------------------------------------------------
    registered = await j.step(
        "register_participant",
        lambda: client.post(
            f"{BASE}/{congress_id}/register",
            json={"congress_id": congress_id, "last_name": "Шодиева", "first_name": "Ситора",
                  "patronymic": "Баходировна", "email": EMAIL, "phone": "+998 90 123 45 67"},
        ),
    )
    assert registered.status_code == 200, f"[register_participant] {registered.status_code}: {registered.text}"

    # --- upload_template -----------------------------------------------------
    uploaded = await j.step(
        "upload_template",
        lambda: client.post(
            f"{BASE}/congresses/{congress_id}/certificate-template",
            files={"file": ("Сертификат.pdf", _blank_certificate(), "application/pdf")},
        ),
    )
    assert uploaded.status_code == 200, f"[upload_template] {uploaded.status_code}: {uploaded.text}"
    assert uploaded.json()["issue_mode"] == "auto", f"[upload_template] режим по умолчанию: {uploaded.json()}"

    # --- import_from_registrations -------------------------------------------
    async def _import():
        url = f"{BASE}/congresses/{congress_id}/certificate-recipients/import-registrations"
        dry = await client.post(url, data={"mode": "append", "dry_run": "true"})
        assert dry.status_code == 200, f"[import_from_registrations] dry_run {dry.status_code}: {dry.text}"
        assert (dry.json()["will_insert"], dry.json()["inserted"]) == (1, 0), f"[import_from_registrations] {dry.json()}"
        return await client.post(url, data={"mode": "append", "dry_run": "false"})

    imported = await j.step("import_from_registrations", _import)
    assert imported.status_code == 200, f"[import_from_registrations] {imported.status_code}: {imported.text}"
    assert imported.json()["inserted"] == 1, f"[import_from_registrations] {imported.json()}"

    # --- create_account ------------------------------------------------------
    password = "sitora-pass-2026"

    async def _sign_up():
        signed = await client.post(
            "/api/auth/register",
            json={"email": EMAIL, "password": password, "last_name": "Шодиева", "first_name": "Ситора"},
        )
        assert signed.status_code == 200, f"[create_account] {signed.status_code}: {signed.text}"
        # регистрация приводит почту к нижнему регистру: по ней кабинет ищет сертификаты
        assert signed.json()["email"] == EMAIL.lower(), f"[create_account] почта: {signed.json()}"
        # а входит человек так, как набрал: регистр значения не имеет
        return await client.post("/api/auth/login", data={"username": EMAIL, "password": password})

    logged_in = await j.step("create_account", _sign_up)
    assert logged_in.status_code == 200, f"[create_account] вход: {logged_in.status_code} {logged_in.text}"
    headers = {"Authorization": f"Bearer {logged_in.json()['access_token']}"}

    # --- closed_before_the_end -----------------------------------------------
    waiting = await j.step("closed_before_the_end", lambda: client.get(f"{BASE}/my-certificates", headers=headers))
    assert waiting.status_code == 200, f"[closed_before_the_end] {waiting.status_code}: {waiting.text}"
    mine = j.contains(
        "closed_before_the_end", waiting.json(),
        lambda item: item["full_name"] == OFFICIAL_NAME and not item["open"] and item["opens_on"] == "2026-09-26",
    )
    assert "998" not in waiting.text, f"[closed_before_the_end] телефон утёк: {waiting.text}"
    too_early = await client.post(f"{BASE}/my-certificates/{mine['recipient_id']}/download", headers=headers)
    assert too_early.status_code == 404, f"[closed_before_the_end] закрытая выдача отдала {too_early.status_code}"

    # --- download_after_the_end ----------------------------------------------
    def _download():
        monkeypatch.setattr(cert_api, "_today", lambda: DAY_AFTER)  # конгресс кончился
        return client.post(f"{BASE}/my-certificates/{mine['recipient_id']}/download", headers=headers)

    downloaded = await j.step("download_after_the_end", _download)
    assert downloaded.status_code == 200, f"[download_after_the_end] {downloaded.status_code}: {downloaded.text}"
    assert downloaded.headers["content-type"] == "application/pdf", f"[download_after_the_end] {downloaded.headers}"

    # --- name_from_registration_on_pdf ---------------------------------------
    reader = await j.step("name_from_registration_on_pdf", lambda: PdfReader(io.BytesIO(downloaded.content)))
    text = reader.pages[0].extract_text()
    assert _squash(OFFICIAL_NAME) in _squash(text), f"[name_from_registration_on_pdf] в PDF нет имени из регистрации: {text!r}"
    assert "CERTIFICATE" in text, "[name_from_registration_on_pdf] исходная страница бланка потеряна"
    assert "001" in text, f"[name_from_registration_on_pdf] нет порядкового номера 001: {text!r}"

    # --- counter_in_account --------------------------------------------------
    left = await j.step("counter_in_account", lambda: client.get(f"{BASE}/my-certificates", headers=headers))
    j.contains(
        "counter_in_account", left.json(),
        lambda item: item["recipient_id"] == mine["recipient_id"] and item["open"] and item["downloads_left"] == 4,
    )
