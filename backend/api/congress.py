"""API для конгрессов — публичные и административные эндпоинты"""
import asyncio
import logging
import os
import sys
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from database import (
    get_db, Congress, CongressRegistration,
    CongressSponsor, CongressProgramDay, CongressProgramSection, CongressSpeaker,
)
from schemas.congress import (
    CongressCreate, CongressUpdate, CongressResponse,
    CongressSponsorCreate, CongressSponsorUpdate, CongressSponsorResponse,
    CongressProgramDayCreate, CongressProgramDayUpdate, CongressProgramDayResponse,
    CongressProgramSectionCreate, CongressProgramSectionUpdate, CongressProgramSectionResponse,
    CongressSpeakerCreate, CongressSpeakerUpdate, CongressSpeakerResponse,
    CongressDetailResponse,
    CongressRegistrationCreate, CongressRegistrationResponse,
)
from functions.auth import get_current_admin
import pdf_pages

router = APIRouter()
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = "uploads"  # как в main.py и content.py — от текущего каталога
# Поля, PDF из которых рисуются страницами для просмотра (К-08)
PDF_PAGES_FIELDS = tuple(
    f"{kind}_file_{lang}" for kind in ("program", "young_scientists") for lang in ("ru", "uz", "en")
)
# Предохранитель от зависшего процесса. Рисование само обрывается через
# pdf_pages.RENDER_TIMEOUT, но процесс может ждать замка за другими PDF
# (до шести файлов одного конгресса, один за другим).
RENDER_PROCESS_TIMEOUT = 15 * 60


async def _ensure_exists(db: AsyncSession, model, obj_id: int, detail: str):
    """Проверить существование родительской записи, иначе 404."""
    result = await db.execute(select(model.id).where(model.id == obj_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail=detail)


async def launch_pdf_render(pdf_path: Path) -> None:
    """Фоновая задача: страницы PDF рисует отдельный процесс.

    Отдельный процесс обязателен: PDFium нельзя вызывать из нескольких
    потоков, а воркер uvicorn многопоточный; заодно падение или раздутая
    память PDFium не задевают сайт. Любой сбой только пишется в лог —
    конгресс к этому моменту уже сохранён.
    """
    try:
        process = await asyncio.create_subprocess_exec(
            sys.executable, "-m", "scripts.render_pdf_pages", str(pdf_path),
            "--uploads-dir", str(pdf_path.parent),
            cwd=BACKEND_DIR,
            env={**os.environ, "PYTHONIOENCODING": "utf-8"},
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
        try:
            output, _ = await asyncio.wait_for(process.communicate(), timeout=RENDER_PROCESS_TIMEOUT)
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            logger.error("Рисование страниц %s убито через %s с", pdf_path.name, RENDER_PROCESS_TIMEOUT)
            if pdf_path.is_file() and pdf_pages.read_manifest(pdf_path) is None:
                pdf_pages.write_error(pdf_path, "timeout")
            return
        text = (output or b"").decode("utf-8", "replace").strip()
        if process.returncode == 0:
            logger.info("Страницы PDF: %s", text)
        else:
            logger.warning("Страницы PDF %s не нарисованы (код %s): %s", pdf_path.name, process.returncode, text)
    except Exception:
        logger.exception("Не удалось запустить рисование страниц %s", pdf_path.name)


def _schedule_pdf_renders(background_tasks: BackgroundTasks, changed: dict) -> None:
    """Задача на каждый новый /uploads/<name>.pdf среди изменённых полей."""
    uploads = Path(UPLOAD_DIR).resolve()
    scheduled = []
    for field in PDF_PAGES_FIELDS:
        if field not in changed:
            continue
        path = pdf_pages.upload_url_to_path(changed[field], uploads)
        if path is not None and path not in scheduled:
            scheduled.append(path)
            background_tasks.add_task(launch_pdf_render, path)


# ==================== КОНГРЕСС CRUD ====================

@router.get("/congresses", response_model=List[CongressResponse])
async def get_congresses(
    db: AsyncSession = Depends(get_db),
    include_inactive: bool = False
):
    query = select(Congress).order_by(desc(Congress.date_start))
    if not include_inactive:
        query = query.where(Congress.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/congresses/{congress_id}", response_model=CongressResponse)
async def get_congress(congress_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Congress).where(Congress.id == congress_id))
    congress = result.scalar_one_or_none()
    if not congress:
        raise HTTPException(status_code=404, detail="Congress not found")
    return congress


@router.get("/congresses/{congress_id}/detail", response_model=CongressDetailResponse)
async def get_congress_detail(congress_id: int, db: AsyncSession = Depends(get_db)):
    """Получить конгресс с вложенными спонсорами, программой (дни→секции→спикеры) и спикерами"""
    result = await db.execute(
        select(Congress)
        .options(
            selectinload(Congress.sponsors),
            selectinload(Congress.speakers),
            selectinload(Congress.program_days)
            .selectinload(CongressProgramDay.sections)
            .selectinload(CongressProgramSection.speakers),
        )
        .where(Congress.id == congress_id)
    )
    congress = result.scalar_one_or_none()
    if not congress:
        raise HTTPException(status_code=404, detail="Congress not found")
    return congress


@router.post("/congresses", response_model=CongressResponse)
async def create_congress(
    data: CongressCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    congress_data = data.model_dump()
    congress = Congress(**congress_data)
    db.add(congress)
    await db.commit()
    await db.refresh(congress)
    _schedule_pdf_renders(background_tasks, congress_data)
    return congress


@router.put("/congresses/{congress_id}", response_model=CongressResponse)
async def update_congress(
    congress_id: int,
    data: CongressUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    result = await db.execute(select(Congress).where(Congress.id == congress_id))
    congress = result.scalar_one_or_none()
    if not congress:
        raise HTTPException(status_code=404, detail="Congress not found")

    update_data = data.model_dump(exclude_unset=True)
    # форма админки шлёт все поля — рисовать нужно только сменившиеся файлы
    changed_files = {
        field: update_data[field]
        for field in PDF_PAGES_FIELDS
        if field in update_data and update_data[field] != getattr(congress, field)
    }
    for key, value in update_data.items():
        setattr(congress, key, value)

    await db.commit()
    await db.refresh(congress)
    _schedule_pdf_renders(background_tasks, changed_files)
    return congress


@router.delete("/congresses/{congress_id}")
async def delete_congress(
    congress_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    result = await db.execute(select(Congress).where(Congress.id == congress_id))
    congress = result.scalar_one_or_none()
    if not congress:
        raise HTTPException(status_code=404, detail="Congress not found")

    await db.delete(congress)
    await db.commit()
    return {"message": "Congress deleted"}


# ==================== СПОНСОРЫ ====================

@router.get("/congress-sponsors", response_model=List[CongressSponsorResponse])
async def get_congress_sponsors(
    db: AsyncSession = Depends(get_db),
    congress_id: Optional[int] = None,
    include_inactive: bool = False
):
    query = select(CongressSponsor).order_by(CongressSponsor.order)
    if congress_id:
        query = query.where(CongressSponsor.congress_id == congress_id)
    if not include_inactive:
        query = query.where(CongressSponsor.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/congress-sponsors", response_model=CongressSponsorResponse)
async def create_congress_sponsor(
    data: CongressSponsorCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    sponsor = CongressSponsor(**data.model_dump())
    db.add(sponsor)
    await db.commit()
    await db.refresh(sponsor)
    return sponsor


@router.put("/congress-sponsors/{sponsor_id}", response_model=CongressSponsorResponse)
async def update_congress_sponsor(
    sponsor_id: int,
    data: CongressSponsorUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    result = await db.execute(select(CongressSponsor).where(CongressSponsor.id == sponsor_id))
    sponsor = result.scalar_one_or_none()
    if not sponsor:
        raise HTTPException(status_code=404, detail="Sponsor not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(sponsor, key, value)

    await db.commit()
    await db.refresh(sponsor)
    return sponsor


@router.delete("/congress-sponsors/{sponsor_id}")
async def delete_congress_sponsor(
    sponsor_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    result = await db.execute(select(CongressSponsor).where(CongressSponsor.id == sponsor_id))
    sponsor = result.scalar_one_or_none()
    if not sponsor:
        raise HTTPException(status_code=404, detail="Sponsor not found")

    await db.delete(sponsor)
    await db.commit()
    return {"message": "Sponsor deleted"}


# ==================== ПРОГРАММА: ДНИ ====================

@router.get("/congress-program-days", response_model=List[CongressProgramDayResponse])
async def get_congress_program_days(
    db: AsyncSession = Depends(get_db),
    congress_id: Optional[int] = None
):
    query = select(CongressProgramDay).order_by(CongressProgramDay.order)
    if congress_id:
        query = query.where(CongressProgramDay.congress_id == congress_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/congress-program-days", response_model=CongressProgramDayResponse)
async def create_congress_program_day(
    data: CongressProgramDayCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    await _ensure_exists(db, Congress, data.congress_id, "Congress not found")
    day = CongressProgramDay(**data.model_dump())
    db.add(day)
    await db.commit()
    await db.refresh(day)
    return day


@router.put("/congress-program-days/{day_id}", response_model=CongressProgramDayResponse)
async def update_congress_program_day(
    day_id: int,
    data: CongressProgramDayUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    result = await db.execute(select(CongressProgramDay).where(CongressProgramDay.id == day_id))
    day = result.scalar_one_or_none()
    if not day:
        raise HTTPException(status_code=404, detail="Program day not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(day, key, value)

    await db.commit()
    await db.refresh(day)
    return day


@router.delete("/congress-program-days/{day_id}")
async def delete_congress_program_day(
    day_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    result = await db.execute(select(CongressProgramDay).where(CongressProgramDay.id == day_id))
    day = result.scalar_one_or_none()
    if not day:
        raise HTTPException(status_code=404, detail="Program day not found")

    await db.delete(day)
    await db.commit()
    return {"message": "Program day deleted"}


# ==================== ПРОГРАММА: СЕКЦИИ ====================

@router.get("/congress-program-sections", response_model=List[CongressProgramSectionResponse])
async def get_congress_program_sections(
    db: AsyncSession = Depends(get_db),
    day_id: Optional[int] = None,
    congress_id: Optional[int] = None
):
    query = select(CongressProgramSection)
    if congress_id is not None:
        # Секции всех дней конгресса, по порядку дней и секций внутри дня
        query = (
            query.join(CongressProgramDay, CongressProgramSection.day_id == CongressProgramDay.id)
            .where(CongressProgramDay.congress_id == congress_id)
            .order_by(CongressProgramDay.order, CongressProgramSection.order)
        )
    else:
        query = query.order_by(CongressProgramSection.order)
    if day_id:
        query = query.where(CongressProgramSection.day_id == day_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/congress-program-sections", response_model=CongressProgramSectionResponse)
async def create_congress_program_section(
    data: CongressProgramSectionCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    await _ensure_exists(db, CongressProgramDay, data.day_id, "Program day not found")
    section = CongressProgramSection(**data.model_dump())
    db.add(section)
    await db.commit()
    await db.refresh(section)
    return section


@router.put("/congress-program-sections/{section_id}", response_model=CongressProgramSectionResponse)
async def update_congress_program_section(
    section_id: int,
    data: CongressProgramSectionUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    result = await db.execute(select(CongressProgramSection).where(CongressProgramSection.id == section_id))
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Program section not found")

    update_data = data.model_dump(exclude_unset=True)
    if "day_id" in update_data:
        # day_id — NOT NULL: без явной проверки null дошёл бы до БД как IntegrityError (500)
        if update_data["day_id"] is None:
            raise HTTPException(status_code=422, detail="day_id не может быть пустым")
        await _ensure_exists(db, CongressProgramDay, update_data["day_id"], "Program day not found")
    for key, value in update_data.items():
        setattr(section, key, value)

    await db.commit()
    await db.refresh(section)
    return section


@router.delete("/congress-program-sections/{section_id}")
async def delete_congress_program_section(
    section_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    result = await db.execute(select(CongressProgramSection).where(CongressProgramSection.id == section_id))
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Program section not found")

    await db.delete(section)
    await db.commit()
    return {"message": "Program section deleted"}


# ==================== СПИКЕРЫ ====================

@router.get("/congress-speakers", response_model=List[CongressSpeakerResponse])
async def get_congress_speakers(
    db: AsyncSession = Depends(get_db),
    congress_id: Optional[int] = None,
    section_id: Optional[int] = None,
    include_inactive: bool = False
):
    query = select(CongressSpeaker).order_by(CongressSpeaker.order)
    if congress_id:
        query = query.where(CongressSpeaker.congress_id == congress_id)
    if section_id:
        query = query.where(CongressSpeaker.section_id == section_id)
    if not include_inactive:
        query = query.where(CongressSpeaker.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/congress-speakers", response_model=CongressSpeakerResponse)
async def create_congress_speaker(
    data: CongressSpeakerCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    await _ensure_exists(db, Congress, data.congress_id, "Congress not found")
    if data.section_id is not None:
        await _ensure_exists(db, CongressProgramSection, data.section_id, "Program section not found")
    speaker = CongressSpeaker(**data.model_dump())
    db.add(speaker)
    await db.commit()
    await db.refresh(speaker)
    return speaker


@router.put("/congress-speakers/{speaker_id}", response_model=CongressSpeakerResponse)
async def update_congress_speaker(
    speaker_id: int,
    data: CongressSpeakerUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    result = await db.execute(select(CongressSpeaker).where(CongressSpeaker.id == speaker_id))
    speaker = result.scalar_one_or_none()
    if not speaker:
        raise HTTPException(status_code=404, detail="Speaker not found")

    update_data = data.model_dump(exclude_unset=True)
    if update_data.get("section_id") is not None:
        await _ensure_exists(
            db, CongressProgramSection, update_data["section_id"], "Program section not found"
        )
    for key, value in update_data.items():
        setattr(speaker, key, value)

    await db.commit()
    await db.refresh(speaker)
    return speaker


@router.delete("/congress-speakers/{speaker_id}")
async def delete_congress_speaker(
    speaker_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    result = await db.execute(select(CongressSpeaker).where(CongressSpeaker.id == speaker_id))
    speaker = result.scalar_one_or_none()
    if not speaker:
        raise HTTPException(status_code=404, detail="Speaker not found")

    await db.delete(speaker)
    await db.commit()
    return {"message": "Speaker deleted"}


# ==================== РЕГИСТРАЦИЯ НА КОНГРЕСС ====================

@router.post("/{congress_id}/register", response_model=CongressRegistrationResponse)
async def register_for_congress(
    congress_id: int,
    registration: CongressRegistrationCreate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Congress).where(Congress.id == congress_id))
    congress = result.scalar_one_or_none()
    if not congress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Congress not found"
        )
    if not congress.registration_open:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is closed"
        )

    reg_data = registration.model_dump()
    reg_data['congress_id'] = congress_id
    db_reg = CongressRegistration(**reg_data)
    db.add(db_reg)
    await db.commit()
    await db.refresh(db_reg)
    return db_reg


@router.get("/congress-registrations", response_model=List[CongressRegistrationResponse])
async def get_congress_registrations(
    db: AsyncSession = Depends(get_db),
    congress_id: Optional[int] = None,
    admin=Depends(get_current_admin)
):
    """Получить регистрации на конгрессы (только для админа)"""
    query = select(CongressRegistration).order_by(desc(CongressRegistration.created_at))
    if congress_id:
        query = query.where(CongressRegistration.congress_id == congress_id)
    result = await db.execute(query)
    return result.scalars().all()
