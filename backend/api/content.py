"""API для управления контентом (админка)"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
import os
import uuid
from datetime import datetime

from database import get_db, BoardMember, Partner, Charter, ChiefRheumatologist, Disease, DiseaseDocument, News, RheumatologyCenter, CenterStaff, SchoolApplication
from sqlalchemy.orm import selectinload
from schemas import (
    BoardMemberCreate, BoardMemberUpdate, BoardMemberResponse,
    PartnerCreate, PartnerUpdate, PartnerResponse,
    CharterCreate, CharterUpdate, CharterResponse,
    ChiefRheumatologistCreate, ChiefRheumatologistUpdate, ChiefRheumatologistResponse,
    DiseaseCreate, DiseaseUpdate, DiseaseResponse,
    DiseaseDocumentCreate, DiseaseDocumentUpdate, DiseaseDocumentResponse,
    NewsCreate, NewsUpdate, NewsResponse,
    RheumatologyCenterCreate, RheumatologyCenterUpdate, RheumatologyCenterResponse, RheumatologyCenterWithStaffResponse,
    CenterStaffCreate, CenterStaffUpdate, CenterStaffResponse,
)
from schemas.rheumatology import SchoolApplicationCreate, SchoolApplicationResponse
from functions.auth import get_current_admin

router = APIRouter()

# Путь для загрузки файлов
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ==================== ЗАГРУЗКА ФАЙЛОВ ====================
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    admin = Depends(get_current_admin)
):
    """Загрузка файла (изображения или документа)"""
    # Генерируем уникальное имя файла
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)

    return {"url": f"/uploads/{filename}", "filename": filename}


# ==================== ЧЛЕНЫ ПРАВЛЕНИЯ ====================
@router.get("/board-members", response_model=List[BoardMemberResponse])
async def get_board_members(
    db: AsyncSession = Depends(get_db),
    include_inactive: bool = False
):
    query = select(BoardMember).order_by(BoardMember.order)
    if not include_inactive:
        query = query.where(BoardMember.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/board-members/{member_id}", response_model=BoardMemberResponse)
async def get_board_member(member_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BoardMember).where(BoardMember.id == member_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Board member not found")
    return member


@router.post("/board-members", response_model=BoardMemberResponse)
async def create_board_member(
    data: BoardMemberCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    member = BoardMember(**data.model_dump())
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


@router.put("/board-members/{member_id}", response_model=BoardMemberResponse)
async def update_board_member(
    member_id: int,
    data: BoardMemberUpdate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    result = await db.execute(select(BoardMember).where(BoardMember.id == member_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Board member not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(member, key, value)

    await db.commit()
    await db.refresh(member)
    return member


@router.delete("/board-members/{member_id}")
async def delete_board_member(
    member_id: int,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    result = await db.execute(select(BoardMember).where(BoardMember.id == member_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Board member not found")

    await db.delete(member)
    await db.commit()
    return {"message": "Board member deleted"}


# ==================== МЕЖДУНАРОДНЫЕ ПАРТНЁРЫ ====================
@router.get("/partners", response_model=List[PartnerResponse])
async def get_partners(
    db: AsyncSession = Depends(get_db),
    include_inactive: bool = False
):
    query = select(Partner).order_by(Partner.order)
    if not include_inactive:
        query = query.where(Partner.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/partners/{partner_id}", response_model=PartnerResponse)
async def get_partner(partner_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Partner).where(Partner.id == partner_id))
    partner = result.scalar_one_or_none()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    return partner


@router.post("/partners", response_model=PartnerResponse)
async def create_partner(
    data: PartnerCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    partner = Partner(**data.model_dump())
    db.add(partner)
    await db.commit()
    await db.refresh(partner)
    return partner


@router.put("/partners/{partner_id}", response_model=PartnerResponse)
async def update_partner(
    partner_id: int,
    data: PartnerUpdate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    result = await db.execute(select(Partner).where(Partner.id == partner_id))
    partner = result.scalar_one_or_none()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(partner, key, value)

    await db.commit()
    await db.refresh(partner)
    return partner


@router.delete("/partners/{partner_id}")
async def delete_partner(
    partner_id: int,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    result = await db.execute(select(Partner).where(Partner.id == partner_id))
    partner = result.scalar_one_or_none()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    await db.delete(partner)
    await db.commit()
    return {"message": "Partner deleted"}


# ==================== УСТАВ ====================
@router.get("/charter", response_model=Optional[CharterResponse])
async def get_active_charter(db: AsyncSession = Depends(get_db)):
    """Получить активный устав"""
    result = await db.execute(
        select(Charter).where(Charter.is_active == True).order_by(desc(Charter.created_at))
    )
    return result.scalar_one_or_none()


@router.get("/charters", response_model=List[CharterResponse])
async def get_all_charters(
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Получить все уставы (для админки)"""
    result = await db.execute(select(Charter).order_by(desc(Charter.created_at)))
    return result.scalars().all()


@router.post("/charters", response_model=CharterResponse)
async def create_charter(
    data: CharterCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    # Деактивируем все предыдущие уставы если новый активен
    if data.is_active:
        await db.execute(
            Charter.__table__.update().values(is_active=False)
        )

    charter = Charter(**data.model_dump())
    db.add(charter)
    await db.commit()
    await db.refresh(charter)
    return charter


@router.put("/charters/{charter_id}", response_model=CharterResponse)
async def update_charter(
    charter_id: int,
    data: CharterUpdate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    result = await db.execute(select(Charter).where(Charter.id == charter_id))
    charter = result.scalar_one_or_none()
    if not charter:
        raise HTTPException(status_code=404, detail="Charter not found")

    # Деактивируем другие если этот становится активным
    if data.is_active:
        await db.execute(
            Charter.__table__.update().where(Charter.id != charter_id).values(is_active=False)
        )

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(charter, key, value)

    await db.commit()
    await db.refresh(charter)
    return charter


@router.delete("/charters/{charter_id}")
async def delete_charter(
    charter_id: int,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    result = await db.execute(select(Charter).where(Charter.id == charter_id))
    charter = result.scalar_one_or_none()
    if not charter:
        raise HTTPException(status_code=404, detail="Charter not found")

    await db.delete(charter)
    await db.commit()
    return {"message": "Charter deleted"}


# ==================== ГЛАВНЫЕ РЕВМАТОЛОГИ ====================
@router.get("/chief-rheumatologists", response_model=List[ChiefRheumatologistResponse])
async def get_chief_rheumatologists(
    db: AsyncSession = Depends(get_db),
    include_inactive: bool = False
):
    query = select(ChiefRheumatologist).order_by(ChiefRheumatologist.order)
    if not include_inactive:
        query = query.where(ChiefRheumatologist.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/chief-rheumatologists/{doctor_id}", response_model=ChiefRheumatologistResponse)
async def get_chief_rheumatologist(doctor_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChiefRheumatologist).where(ChiefRheumatologist.id == doctor_id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Chief rheumatologist not found")
    return doctor


@router.post("/chief-rheumatologists", response_model=ChiefRheumatologistResponse)
async def create_chief_rheumatologist(
    data: ChiefRheumatologistCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    doctor = ChiefRheumatologist(**data.model_dump())
    db.add(doctor)
    await db.commit()
    await db.refresh(doctor)
    return doctor


@router.put("/chief-rheumatologists/{doctor_id}", response_model=ChiefRheumatologistResponse)
async def update_chief_rheumatologist(
    doctor_id: int,
    data: ChiefRheumatologistUpdate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    result = await db.execute(select(ChiefRheumatologist).where(ChiefRheumatologist.id == doctor_id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Chief rheumatologist not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(doctor, key, value)

    await db.commit()
    await db.refresh(doctor)
    return doctor


@router.delete("/chief-rheumatologists/{doctor_id}")
async def delete_chief_rheumatologist(
    doctor_id: int,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    result = await db.execute(select(ChiefRheumatologist).where(ChiefRheumatologist.id == doctor_id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Chief rheumatologist not found")

    await db.delete(doctor)
    await db.commit()
    return {"message": "Chief rheumatologist deleted"}


# ==================== ЗАБОЛЕВАНИЯ ====================
@router.get("/diseases", response_model=List[DiseaseResponse])
async def get_diseases(
    db: AsyncSession = Depends(get_db),
    include_inactive: bool = False
):
    query = select(Disease).order_by(Disease.order)
    if not include_inactive:
        query = query.where(Disease.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/diseases/{disease_id}", response_model=DiseaseResponse)
async def get_disease(disease_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Disease).where(Disease.id == disease_id))
    disease = result.scalar_one_or_none()
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found")
    return disease


@router.post("/diseases", response_model=DiseaseResponse)
async def create_disease(
    data: DiseaseCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    disease = Disease(**data.model_dump())
    db.add(disease)
    await db.commit()
    await db.refresh(disease)
    return disease


@router.put("/diseases/{disease_id}", response_model=DiseaseResponse)
async def update_disease(
    disease_id: int,
    data: DiseaseUpdate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    result = await db.execute(select(Disease).where(Disease.id == disease_id))
    disease = result.scalar_one_or_none()
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(disease, key, value)

    await db.commit()
    await db.refresh(disease)
    return disease


@router.delete("/diseases/{disease_id}")
async def delete_disease(
    disease_id: int,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    result = await db.execute(select(Disease).where(Disease.id == disease_id))
    disease = result.scalar_one_or_none()
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found")

    await db.delete(disease)
    await db.commit()
    return {"message": "Disease deleted"}


# ==================== ДОКУМЕНТЫ О ЗАБОЛЕВАНИЯХ ====================
@router.get("/disease-documents", response_model=List[DiseaseDocumentResponse])
async def get_disease_documents(
    db: AsyncSession = Depends(get_db),
    disease_id: Optional[int] = None,
    include_inactive: bool = False
):
    query = select(DiseaseDocument).order_by(DiseaseDocument.order)
    if disease_id:
        query = query.where(DiseaseDocument.disease_id == disease_id)
    if not include_inactive:
        query = query.where(DiseaseDocument.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/disease-documents", response_model=DiseaseDocumentResponse)
async def create_disease_document(
    data: DiseaseDocumentCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    document = DiseaseDocument(**data.model_dump())
    db.add(document)
    await db.commit()
    await db.refresh(document)
    return document


@router.put("/disease-documents/{doc_id}", response_model=DiseaseDocumentResponse)
async def update_disease_document(
    doc_id: int,
    data: DiseaseDocumentUpdate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    result = await db.execute(select(DiseaseDocument).where(DiseaseDocument.id == doc_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(document, key, value)

    await db.commit()
    await db.refresh(document)
    return document


@router.delete("/disease-documents/{doc_id}")
async def delete_disease_document(
    doc_id: int,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    result = await db.execute(select(DiseaseDocument).where(DiseaseDocument.id == doc_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    await db.delete(document)
    await db.commit()
    return {"message": "Document deleted"}


# ==================== НОВОСТИ ====================
@router.get("/news/featured", response_model=List[NewsResponse])
async def get_featured_news(
    db: AsyncSession = Depends(get_db),
    limit: int = 10
):
    """Получить избранные новости/события для карусели"""
    query = select(News).where(
        News.is_published == True,
        News.is_featured == True
    ).order_by(desc(News.created_at)).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/news/events", response_model=List[NewsResponse])
async def get_events(
    db: AsyncSession = Depends(get_db),
    upcoming_only: bool = True,
    limit: int = 10
):
    """Получить события"""
    query = select(News).where(
        News.is_published == True,
        News.news_type == "event"
    )
    if upcoming_only:
        query = query.where(News.event_date_start >= datetime.now())
    query = query.order_by(News.event_date_start).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/news", response_model=List[NewsResponse])
async def get_news(
    db: AsyncSession = Depends(get_db),
    news_type: Optional[str] = None,
    published_only: bool = True,
    skip: int = 0,
    limit: int = 20
):
    query = select(News).order_by(desc(News.created_at))
    if news_type:
        query = query.where(News.news_type == news_type)
    if published_only:
        query = query.where(News.is_published == True)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/news/{news_id}", response_model=NewsResponse)
async def get_news_item(news_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(News).where(News.id == news_id))
    news = result.scalar_one_or_none()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    return news


@router.post("/news", response_model=NewsResponse)
async def create_news(
    data: NewsCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    news = News(**data.model_dump(), author_id=admin.id)
    db.add(news)
    await db.commit()
    await db.refresh(news)
    return news


@router.put("/news/{news_id}", response_model=NewsResponse)
async def update_news(
    news_id: int,
    data: NewsUpdate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    result = await db.execute(select(News).where(News.id == news_id))
    news = result.scalar_one_or_none()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(news, key, value)

    await db.commit()
    await db.refresh(news)
    return news


@router.delete("/news/{news_id}")
async def delete_news(
    news_id: int,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    result = await db.execute(select(News).where(News.id == news_id))
    news = result.scalar_one_or_none()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")

    await db.delete(news)
    await db.commit()
    return {"message": "News deleted"}


# ==================== РЕВМАТОЛОГИЧЕСКИЕ ЦЕНТРЫ ====================
@router.get("/centers", response_model=List[RheumatologyCenterResponse])
async def get_centers(
    db: AsyncSession = Depends(get_db),
    include_inactive: bool = False
):
    query = select(RheumatologyCenter).order_by(RheumatologyCenter.order)
    if not include_inactive:
        query = query.where(RheumatologyCenter.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/centers/{center_id}", response_model=RheumatologyCenterResponse)
async def get_center(center_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RheumatologyCenter).where(RheumatologyCenter.id == center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
    return center


@router.post("/centers", response_model=RheumatologyCenterResponse)
async def create_center(
    data: RheumatologyCenterCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    center = RheumatologyCenter(**data.model_dump())
    db.add(center)
    await db.commit()
    await db.refresh(center)
    return center


@router.put("/centers/{center_id}", response_model=RheumatologyCenterResponse)
async def update_center(
    center_id: int,
    data: RheumatologyCenterUpdate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    result = await db.execute(select(RheumatologyCenter).where(RheumatologyCenter.id == center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(center, key, value)

    await db.commit()
    await db.refresh(center)
    return center


@router.delete("/centers/{center_id}")
async def delete_center(
    center_id: int,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    result = await db.execute(select(RheumatologyCenter).where(RheumatologyCenter.id == center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")

    await db.delete(center)
    await db.commit()
    return {"message": "Center deleted"}


@router.get("/centers/{center_id}/with-staff", response_model=RheumatologyCenterWithStaffResponse)
async def get_center_with_staff(center_id: int, db: AsyncSession = Depends(get_db)):
    """Получить центр вместе с сотрудниками"""
    result = await db.execute(
        select(RheumatologyCenter)
        .options(selectinload(RheumatologyCenter.staff))
        .where(RheumatologyCenter.id == center_id)
    )
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
    return center


# ==================== СОТРУДНИКИ ЦЕНТРОВ ====================
@router.get("/center-staff", response_model=List[CenterStaffResponse])
async def get_center_staff(
    db: AsyncSession = Depends(get_db),
    center_id: Optional[int] = None,
    include_inactive: bool = False
):
    """Получить сотрудников центров"""
    query = select(CenterStaff).order_by(CenterStaff.order)
    if center_id:
        query = query.where(CenterStaff.center_id == center_id)
    if not include_inactive:
        query = query.where(CenterStaff.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/center-staff/{staff_id}", response_model=CenterStaffResponse)
async def get_staff_member(staff_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CenterStaff).where(CenterStaff.id == staff_id))
    staff = result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff


@router.post("/center-staff", response_model=CenterStaffResponse)
async def create_staff_member(
    data: CenterStaffCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    # Проверяем что центр существует
    result = await db.execute(select(RheumatologyCenter).where(RheumatologyCenter.id == data.center_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Center not found")

    staff = CenterStaff(**data.model_dump())
    db.add(staff)
    await db.commit()
    await db.refresh(staff)
    return staff


@router.put("/center-staff/{staff_id}", response_model=CenterStaffResponse)
async def update_staff_member(
    staff_id: int,
    data: CenterStaffUpdate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    result = await db.execute(select(CenterStaff).where(CenterStaff.id == staff_id))
    staff = result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    # Если меняется center_id, проверяем что новый центр существует
    if data.center_id:
        result = await db.execute(select(RheumatologyCenter).where(RheumatologyCenter.id == data.center_id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Center not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(staff, key, value)

    await db.commit()
    await db.refresh(staff)
    return staff


@router.delete("/center-staff/{staff_id}")
async def delete_staff_member(
    staff_id: int,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    result = await db.execute(select(CenterStaff).where(CenterStaff.id == staff_id))
    staff = result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    await db.delete(staff)
    await db.commit()
    return {"message": "Staff member deleted"}


# ==================== РЕГИСТРАЦИЯ НА ШКОЛУ РЕВМАТОЛОГОВ ====================
@router.post("/school-applications", response_model=SchoolApplicationResponse)
async def create_school_application(
    data: SchoolApplicationCreate,
    db: AsyncSession = Depends(get_db)
):
    """Регистрация на школу ревматологов (публичный эндпоинт)"""
    # Валидация
    if data.school_type not in ["rheumatologist", "patient"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid school type"
        )
    if data.category not in ["highest", "first", "second", "third", "none"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category"
        )

    application = SchoolApplication(**data.model_dump())
    db.add(application)
    await db.commit()
    await db.refresh(application)
    return application


@router.get("/school-applications", response_model=List[SchoolApplicationResponse])
async def get_school_applications(
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Получить все заявки на школу (только для админа)"""
    result = await db.execute(
        select(SchoolApplication).order_by(desc(SchoolApplication.created_at))
    )
    return result.scalars().all()
