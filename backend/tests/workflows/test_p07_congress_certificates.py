"""P-07: участник получает именной сертификат конгресса.

Правило голой базы: состояние строится только через HTTP (`client`), никаких
ORM-фабрик. Бланк сертификата — входные данные админа, поэтому собирается
reportlab прямо в прогоне, как его прислали бы организаторы.
"""
import io

from pypdf import PdfReader
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas

PROCESS_ID = "P-07"
BASE = "/api/congress"
OFFICIAL_NAME = "Шодиева Ситора Баходировна"
CSV = (
    "ФИО;Телефон\n"
    f"{OFFICIAL_NAME};+998 90 123 45 67\n"
    "Karimov Bobur;\n"
).encode("utf-8")


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


async def test_p07(journey, client):
    j = journey(PROCESS_ID)

    # --- create_congress -----------------------------------------------------
    created = await j.step(
        "create_congress",
        lambda: client.post(
            f"{BASE}/congresses",
            json={"title_ru": "XII съезд ревматологов", "title_uz": "Revmatologlar XII qurultoyi",
                  "title_en": "12th Congress of Rheumatologists"},
        ),
    )
    assert created.status_code == 200, f"[create_congress] {created.status_code}: {created.text}"
    congress_id = created.json()["id"]

    # --- upload_template -----------------------------------------------------
    uploaded = await j.step(
        "upload_template",
        lambda: client.post(
            f"{BASE}/congresses/{congress_id}/certificate-template",
            files={"file": ("Сертификат.pdf", _blank_certificate(), "application/pdf")},
        ),
    )
    assert uploaded.status_code == 200, f"[upload_template] {uploaded.status_code}: {uploaded.text}"
    assert uploaded.json()["has_template"] is True, f"[upload_template] {uploaded.json()}"
    assert "pdf" not in uploaded.json(), "[upload_template] байты шаблона не должны уходить в ответ"

    # --- import_recipients ---------------------------------------------------
    async def _import():
        url = f"{BASE}/congresses/{congress_id}/certificate-recipients/import"
        dry = await client.post(url, files={"file": ("list.csv", CSV, "text/csv")},
                                data={"mode": "append", "dry_run": "true"})
        assert dry.status_code == 200, f"[import_recipients] dry_run {dry.status_code}: {dry.text}"
        assert (dry.json()["accepted"], dry.json()["will_insert"], dry.json()["inserted"]) == (2, 2, 0), f"[import_recipients] dry_run {dry.json()}"
        return await client.post(url, files={"file": ("list.csv", CSV, "text/csv")},
                                 data={"mode": "append", "dry_run": "false"})

    imported = await j.step("import_recipients", _import)
    assert imported.status_code == 200, f"[import_recipients] {imported.status_code}: {imported.text}"
    assert imported.json()["inserted"] == 2, f"[import_recipients] {imported.json()}"
    listing = await client.get(f"{BASE}/congresses/{congress_id}/certificate-recipients")
    numbers = [(r["number"], r["full_name"]) for r in listing.json()["items"]]
    assert numbers == [(1, OFFICIAL_NAME), (2, "Karimov Bobur")], f"[import_recipients] номера не по порядку файла: {numbers}"

    # --- open_issuing --------------------------------------------------------
    async def _open():
        settings = await client.put(f"{BASE}/congresses/{congress_id}/certificate-settings", json={"issue_mode": "open"})
        assert settings.status_code == 200, f"[open_issuing] {settings.status_code}: {settings.text}"
        return await client.get(f"{BASE}/congresses/{congress_id}/certificates/status")

    status = await j.step("open_issuing", _open)
    assert status.json() == {"open": True, "opens_on": None}, f"[open_issuing] статус {status.json()}"

    # --- suggest -------------------------------------------------------------
    suggested = await j.step(
        "suggest",
        lambda: client.get(f"{BASE}/congresses/{congress_id}/certificates/suggest", params={"q": "ситора шодиева"}),
    )
    assert suggested.status_code == 200, f"[suggest] {suggested.status_code}: {suggested.text}"
    assert all(set(s) == {"id", "full_name", "needs_phone"} for s in suggested.json()) and "998" not in suggested.text, (
        f"[suggest] телефон утёк: {suggested.text}"
    )
    me = j.contains("suggest", suggested.json(), lambda s: s["full_name"] == OFFICIAL_NAME and s["needs_phone"])

    # --- issue_with_phone ----------------------------------------------------
    def _issue():
        return client.post(
            f"{BASE}/congresses/{congress_id}/certificates/issue",
            json={"recipient_id": me["id"], "full_name": me["full_name"], "phone": "90 123 45 67"},
        )

    issued = await j.step("issue_with_phone", _issue)
    assert issued.status_code == 200, f"[issue_with_phone] {issued.status_code}: {issued.text}"
    assert issued.headers["content-type"] == "application/pdf", f"[issue_with_phone] {issued.headers}"

    # --- official_name_on_pdf ------------------------------------------------
    def _read_pdf():
        return PdfReader(io.BytesIO(issued.content))

    reader = await j.step("official_name_on_pdf", _read_pdf)
    text = reader.pages[0].extract_text()
    assert _squash(OFFICIAL_NAME) in _squash(text), f"[official_name_on_pdf] в PDF нет имени из списка: {text!r}"
    assert "CERTIFICATE" in text, "[official_name_on_pdf] исходная страница бланка потеряна"
    assert "001" in text, f"[official_name_on_pdf] на PDF нет порядкового номера 001: {text!r}"
    assert 'filename="Certificate_Shodieva_Sitora_Bakhodirovna.pdf"' in issued.headers["content-disposition"], (
        f"[official_name_on_pdf] {issued.headers['content-disposition']}"
    )

    # --- limit_after_five ----------------------------------------------------
    async def _exhaust():
        for n in range(2, 6):
            again = await _issue()
            assert again.status_code == 200, f"[limit_after_five] выдача {n}: {again.status_code} {again.text}"
        return await _issue()

    sixth = await j.step("limit_after_five", _exhaust)
    assert (sixth.status_code, sixth.json()) == (403, {"detail": "limit_reached"}), (
        f"[limit_after_five] шестая выдача: {sixth.status_code} {sixth.text}"
    )
