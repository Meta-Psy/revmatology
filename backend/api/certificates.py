"""Именные сертификаты конгресса (К-11): публичная выдача и админские маршруты.

Подключён в api/__init__.py под /api/congress. Поведение — design-doc
_specs/2026-09-22-congress-certificates-design.md §5.
"""
import io
import logging
import re
import time
from collections import deque
from typing import Literal, Optional
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, Response, UploadFile
from pypdf import PdfReader
from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from database import CertificateRecipient, CertificateTemplate, Congress, get_db
from database.models import CERTIFICATE_DEFAULTS
from functions.auth import get_current_admin
from functions.certificate_names import (
    NoNameColumn,
    certificate_filename,
    normalize_name,
    parse_recipients_csv,
    phone_digits,
    phones_match,
)
from functions.certificate_pdf import Box, render_certificate
from schemas.certificates import (
    CertificateImportReport,
    CertificateIssueRequest,
    CertificatePreviewRequest,
    CertificateRecipientCreate,
    CertificateRecipientList,
    CertificateRecipientResponse,
    CertificateRecipientUpdate,
    CertificateSettingsResponse,
    CertificateSettingsUpdate,
    CertificateStatus,
    CertificateSuggestion,
)

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_DOWNLOADS = 5
SUGGEST_LIMIT = 7
SUGGEST_MIN_CHARS = 3
SUGGEST_PER_MINUTE = 30
ISSUE_PER_MINUTE = 10
RATE_WINDOW_SECONDS = 60
MAX_TEMPLATE_SIZE = 20 * 1024 * 1024
MAX_CSV_SIZE = 5 * 1024 * 1024


# ==================== ограничение частоты ====================

class RateLimiter:
    """Скользящее окно в памяти процесса по ключу «ведро:IP».

    При двух воркерах uvicorn фактический порог до ×2 — принято в design-doc.
    """

    def __init__(self, window: float = RATE_WINDOW_SECONDS):
        self.window = window
        self._hits: dict[str, deque[float]] = {}

    def allow(self, bucket: str, ip: str, limit: int) -> bool:
        now = time.monotonic()
        hits = self._hits.setdefault(f"{bucket}:{ip}", deque())
        while hits and now - hits[0] >= self.window:
            hits.popleft()
        if len(hits) >= limit:
            return False
        hits.append(now)
        return True

    def reset(self) -> None:
        self._hits.clear()


limiter = RateLimiter()


def _client_ip(request: Request) -> str:
    # X-Real-IP ставит nginx ($remote_addr) и перезаписывает присланный клиентом
    return request.headers.get("x-real-ip") or (request.client.host if request.client else "unknown")


def _throttle(request: Request, bucket: str, limit: int) -> None:
    if not limiter.allow(bucket, _client_ip(request), limit):
        raise HTTPException(status_code=429, detail="too_many_requests")


# ==================== помощники ====================

async def _ensure_congress(db: AsyncSession, congress_id: int) -> None:
    result = await db.execute(select(Congress.id).where(Congress.id == congress_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Congress not found")


async def _get_template(db: AsyncSession, congress_id: int) -> Optional[CertificateTemplate]:
    result = await db.execute(select(CertificateTemplate).where(CertificateTemplate.congress_id == congress_id))
    return result.scalar_one_or_none()


async def _is_open(db: AsyncSession, congress_id: int) -> bool:
    """Выдача открыта и шаблон загружен — без чтения байтов PDF (зовётся на каждую подсказку)."""
    result = await db.execute(
        select(CertificateTemplate.id).where(
            CertificateTemplate.congress_id == congress_id,
            CertificateTemplate.is_open.is_(True),
            CertificateTemplate.pdf.isnot(None),
        )
    )
    return result.scalar_one_or_none() is not None


def _settings(congress_id: int, template: Optional[CertificateTemplate]) -> CertificateSettingsResponse:
    """Настройки без байтов PDF; строки ещё нет — значения по умолчанию."""
    if template is None:
        return CertificateSettingsResponse(congress_id=congress_id, has_template=False, **CERTIFICATE_DEFAULTS)
    return CertificateSettingsResponse(
        congress_id=congress_id,
        has_template=template.pdf is not None,
        pdf_filename=template.pdf_filename,
        updated_at=template.updated_at,
        **{key: getattr(template, key) for key in CERTIFICATE_DEFAULTS},
    )


async def _get_or_create_template(db: AsyncSession, congress_id: int) -> CertificateTemplate:
    template = await _get_template(db, congress_id)
    if template is None:
        template = CertificateTemplate(congress_id=congress_id, **CERTIFICATE_DEFAULTS)
        db.add(template)
    return template


async def _render(pdf: bytes, template: CertificateTemplate, name: str, outline: bool = False) -> bytes:
    """Сборка (CPU) — в пуле потоков; настройки читаются здесь, в цикле событий."""
    box = Box(template.box_x_mm, template.box_y_mm, template.box_w_mm, template.box_h_mm)
    return await run_in_threadpool(
        render_certificate, pdf, name, box, template.font_max_pt, template.font_min_pt,
        color=template.text_color, outline=outline,
    )


def _like_words(q: Optional[str]) -> list[str]:
    """Слова запроса как LIKE-шаблоны по name_key (с экранированием % _ \\)."""
    words = normalize_name(q or "").split()
    return ["%" + re.sub(r"([\\%_])", r"\\\1", w) + "%" for w in words]


def _name_filters(q: Optional[str]):
    return [CertificateRecipient.name_key.like(p, escape="\\") for p in _like_words(q)]


def _content_disposition(kind: str, full_name: str) -> str:
    ascii_name = certificate_filename(full_name)
    original = "Certificate_" + "_".join(re.sub(r'[\\/:*?"<>|]', "", full_name).split()) + ".pdf"
    return f"{kind}; filename=\"{ascii_name}\"; filename*=UTF-8''{quote(original)}"


def _pdf_response(pdf: bytes, disposition: str) -> Response:
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": disposition, "Cache-Control": "no-store"},
    )


async def _get_recipient(db: AsyncSession, rid: int) -> CertificateRecipient:
    recipient = await db.get(CertificateRecipient, rid)
    if recipient is None:
        raise HTTPException(status_code=404, detail="Recipient not found")
    return recipient


# ==================== публичные ====================

@router.get("/congresses/{congress_id}/certificates/status", response_model=CertificateStatus)
async def certificate_status(congress_id: int, db: AsyncSession = Depends(get_db)):
    return {"open": await _is_open(db, congress_id)}


@router.get("/congresses/{congress_id}/certificates/suggest", response_model=list[CertificateSuggestion])
async def suggest_recipients(
    congress_id: int,
    request: Request,
    q: str = "",
    db: AsyncSession = Depends(get_db),
):
    _throttle(request, "suggest", SUGGEST_PER_MINUTE)
    if len("".join(normalize_name(q).split())) < SUGGEST_MIN_CHARS:
        return []
    if not await _is_open(db, congress_id):
        return []
    result = await db.execute(
        select(CertificateRecipient.id, CertificateRecipient.full_name, CertificateRecipient.phone_digits)
        .where(CertificateRecipient.congress_id == congress_id, *_name_filters(q))
        .order_by(CertificateRecipient.full_name, CertificateRecipient.id)
        .limit(SUGGEST_LIMIT)
    )
    # телефон в ответ не попадает — только признак, что его спросят (ТЗ §15)
    return [{"id": rid, "full_name": name, "needs_phone": bool(phone)} for rid, name, phone in result.all()]


@router.post("/congresses/{congress_id}/certificates/issue")
async def issue_certificate(
    congress_id: int,
    data: CertificateIssueRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    _throttle(request, "issue", ISSUE_PER_MINUTE)
    not_found = HTTPException(status_code=404, detail="not_found")  # одинаково: не подсказываем, что не так

    template = await _get_template(db, congress_id)
    if not (template and template.is_open and template.pdf is not None):
        raise not_found
    recipient = (await db.execute(
        select(CertificateRecipient).where(
            CertificateRecipient.id == data.recipient_id,
            CertificateRecipient.congress_id == congress_id,
        )
    )).scalar_one_or_none()
    if recipient is None:
        raise not_found
    if recipient.phone_digits and not phones_match(recipient.phone_digits, data.phone or ""):
        raise not_found
    full_name = recipient.full_name

    # условное списание: атомарно и при двух воркерах
    charged = await db.execute(
        update(CertificateRecipient)
        .where(CertificateRecipient.id == recipient.id, CertificateRecipient.download_count < MAX_DOWNLOADS)
        .values(download_count=CertificateRecipient.download_count + 1)
        .returning(CertificateRecipient.id)
    )
    if charged.scalar_one_or_none() is None:
        await db.rollback()
        raise HTTPException(status_code=403, detail="limit_reached")
    try:
        pdf = await _render(template.pdf, template, full_name)
    except Exception:
        # списание не зафиксировано — откат транзакции возвращает счётчик
        await db.rollback()
        logger.exception("Сертификат не собран: конгресс %s, получатель %s", congress_id, data.recipient_id)
        raise HTTPException(status_code=500, detail="render_failed")
    await db.commit()
    return _pdf_response(pdf, _content_disposition("attachment", full_name))


# ==================== админские: настройки и шаблон ====================

@router.get("/congresses/{congress_id}/certificate-settings", response_model=CertificateSettingsResponse)
async def get_certificate_settings(congress_id: int, db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    await _ensure_congress(db, congress_id)
    return _settings(congress_id, await _get_template(db, congress_id))


@router.put("/congresses/{congress_id}/certificate-settings", response_model=CertificateSettingsResponse)
async def update_certificate_settings(
    congress_id: int,
    data: CertificateSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    await _ensure_congress(db, congress_id)
    template = await _get_or_create_template(db, congress_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(template, key, value)
    if template.font_min_pt > template.font_max_pt:
        await db.rollback()
        raise HTTPException(status_code=422, detail="font_min_gt_max")
    await db.commit()
    await db.refresh(template)
    return _settings(congress_id, template)


@router.post("/congresses/{congress_id}/certificate-template", response_model=CertificateSettingsResponse)
async def upload_certificate_template(
    congress_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    await _ensure_congress(db, congress_id)
    data = await file.read(MAX_TEMPLATE_SIZE + 1)
    if len(data) > MAX_TEMPLATE_SIZE:
        raise HTTPException(status_code=413, detail="too_large")
    if not data.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="not_pdf")
    template = await _get_or_create_template(db, congress_id)
    try:
        if not PdfReader(io.BytesIO(data)).pages:
            raise ValueError("no pages")
        # пробная сборка: шаблон, который не собирается, не должен дойти до участников
        await _render(data, template, "Test")
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=400, detail="not_pdf")
    template.pdf = data
    template.pdf_filename = (file.filename or "template.pdf")[:255]
    await db.commit()
    await db.refresh(template)
    return _settings(congress_id, template)


@router.post("/congresses/{congress_id}/certificate-preview")
async def preview_certificate(
    congress_id: int,
    data: CertificatePreviewRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Пробный PDF с контуром рамки; счётчиков не трогает."""
    template = await _get_template(db, congress_id)
    if template is None or template.pdf is None:
        raise HTTPException(status_code=400, detail="no_template")
    pdf = await _render(template.pdf, template, data.name, outline=True)
    return _pdf_response(pdf, _content_disposition("inline", data.name))


# ==================== админские: получатели ====================

@router.get("/congresses/{congress_id}/certificate-recipients", response_model=CertificateRecipientList)
async def list_recipients(
    congress_id: int,
    q: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    conditions = [CertificateRecipient.congress_id == congress_id, *_name_filters(q)]
    total = (await db.execute(select(func.count(CertificateRecipient.id)).where(*conditions))).scalar_one()
    result = await db.execute(
        select(CertificateRecipient).where(*conditions)
        .order_by(CertificateRecipient.full_name, CertificateRecipient.id)
        .offset(skip).limit(limit)
    )
    return {"items": result.scalars().all(), "total": total}


@router.post("/congresses/{congress_id}/certificate-recipients", response_model=CertificateRecipientResponse)
async def create_recipient(
    congress_id: int,
    data: CertificateRecipientCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    await _ensure_congress(db, congress_id)
    recipient = CertificateRecipient(
        congress_id=congress_id,
        full_name=data.full_name,
        name_key=normalize_name(data.full_name),
        phone_digits=phone_digits(data.phone) or None,
        download_count=0,
    )
    db.add(recipient)
    await db.commit()
    await db.refresh(recipient)
    return recipient


@router.put("/certificate-recipients/{rid}", response_model=CertificateRecipientResponse)
async def update_recipient(
    rid: int,
    data: CertificateRecipientUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    recipient = await _get_recipient(db, rid)
    sent = data.model_dump(exclude_unset=True)
    if sent.get("full_name"):
        recipient.full_name = sent["full_name"]
        recipient.name_key = normalize_name(sent["full_name"])
    if "phone" in sent:
        recipient.phone_digits = phone_digits(sent["phone"]) or None
    await db.commit()
    await db.refresh(recipient)
    return recipient


@router.delete("/certificate-recipients/{rid}")
async def delete_recipient(rid: int, db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    recipient = await _get_recipient(db, rid)
    await db.delete(recipient)
    await db.commit()
    return {"ok": True}


@router.post("/certificate-recipients/{rid}/reset", response_model=CertificateRecipientResponse)
async def reset_recipient(rid: int, db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    recipient = await _get_recipient(db, rid)
    recipient.download_count = 0
    await db.commit()
    await db.refresh(recipient)
    return recipient


@router.post("/congresses/{congress_id}/certificate-recipients/import", response_model=CertificateImportReport)
async def import_recipients(
    congress_id: int,
    file: UploadFile = File(...),
    mode: Literal["append", "replace"] = Form("append"),
    dry_run: bool = Form(False),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    await _ensure_congress(db, congress_id)
    data = await file.read(MAX_CSV_SIZE + 1)
    if len(data) > MAX_CSV_SIZE:
        raise HTTPException(status_code=413, detail="too_large")
    try:
        parsed = parse_recipients_csv(data)
    except NoNameColumn as exc:
        raise HTTPException(status_code=400, detail={"code": "no_name_column", "columns": exc.columns})

    rows = parsed.rows
    skipped = 0
    if mode == "append":
        existing = set((await db.execute(
            select(CertificateRecipient.name_key, CertificateRecipient.phone_digits)
            .where(CertificateRecipient.congress_id == congress_id)
        )).all())
        rows = [r for r in parsed.rows if (r.name_key, r.phone_digits) not in existing]
        skipped = len(parsed.rows) - len(rows)

    if not dry_run:
        if mode == "replace":
            await db.execute(delete(CertificateRecipient).where(CertificateRecipient.congress_id == congress_id))
        db.add_all(
            CertificateRecipient(
                congress_id=congress_id, full_name=r.full_name, name_key=r.name_key,
                phone_digits=r.phone_digits, download_count=0,
            )
            for r in rows
        )
        await db.commit()

    return CertificateImportReport(
        accepted=parsed.accepted,
        empty_rows=parsed.empty_rows,
        duplicates_in_file=parsed.duplicates_in_file,
        skipped_existing=skipped,
        inserted=0 if dry_run else len(rows),
        sample=[r.full_name for r in parsed.rows[:5]],
        columns=parsed.columns,
    )
