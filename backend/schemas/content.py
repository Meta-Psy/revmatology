from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ==================== ЧЛЕНЫ ПРАВЛЕНИЯ ====================
class BoardMemberBase(BaseModel):
    last_name_ru: str
    last_name_uz: str
    last_name_en: str
    first_name_ru: str
    first_name_uz: str
    first_name_en: str
    patronymic_ru: Optional[str] = None
    patronymic_uz: Optional[str] = None
    patronymic_en: Optional[str] = None
    position_ru: Optional[str] = None
    position_uz: Optional[str] = None
    position_en: Optional[str] = None
    degree_ru: Optional[str] = None
    degree_uz: Optional[str] = None
    degree_en: Optional[str] = None
    workplace_ru: Optional[str] = None
    workplace_uz: Optional[str] = None
    workplace_en: Optional[str] = None
    bio_ru: Optional[str] = None
    bio_uz: Optional[str] = None
    bio_en: Optional[str] = None
    achievements_ru: Optional[str] = None
    achievements_uz: Optional[str] = None
    achievements_en: Optional[str] = None
    photo_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    order: int = 0
    is_active: bool = True


class BoardMemberCreate(BoardMemberBase):
    pass


class BoardMemberUpdate(BaseModel):
    last_name_ru: Optional[str] = None
    last_name_uz: Optional[str] = None
    last_name_en: Optional[str] = None
    first_name_ru: Optional[str] = None
    first_name_uz: Optional[str] = None
    first_name_en: Optional[str] = None
    patronymic_ru: Optional[str] = None
    patronymic_uz: Optional[str] = None
    patronymic_en: Optional[str] = None
    position_ru: Optional[str] = None
    position_uz: Optional[str] = None
    position_en: Optional[str] = None
    degree_ru: Optional[str] = None
    degree_uz: Optional[str] = None
    degree_en: Optional[str] = None
    workplace_ru: Optional[str] = None
    workplace_uz: Optional[str] = None
    workplace_en: Optional[str] = None
    bio_ru: Optional[str] = None
    bio_uz: Optional[str] = None
    bio_en: Optional[str] = None
    achievements_ru: Optional[str] = None
    achievements_uz: Optional[str] = None
    achievements_en: Optional[str] = None
    photo_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class BoardMemberResponse(BoardMemberBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== МЕЖДУНАРОДНЫЕ ПАРТНЁРЫ ====================
class PartnerBase(BaseModel):
    name_ru: str
    name_uz: str
    name_en: str
    short_name: Optional[str] = None
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    country_ru: Optional[str] = None
    country_uz: Optional[str] = None
    country_en: Optional[str] = None
    order: int = 0
    is_active: bool = True


class PartnerCreate(PartnerBase):
    pass


class PartnerUpdate(BaseModel):
    name_ru: Optional[str] = None
    name_uz: Optional[str] = None
    name_en: Optional[str] = None
    short_name: Optional[str] = None
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    country_ru: Optional[str] = None
    country_uz: Optional[str] = None
    country_en: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class PartnerResponse(PartnerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== УСТАВ ====================
class CharterBase(BaseModel):
    title_ru: str
    title_uz: str
    title_en: str
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    file_url: str
    version: Optional[str] = None
    is_active: bool = True


class CharterCreate(CharterBase):
    pass


class CharterUpdate(BaseModel):
    title_ru: Optional[str] = None
    title_uz: Optional[str] = None
    title_en: Optional[str] = None
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    file_url: Optional[str] = None
    version: Optional[str] = None
    is_active: Optional[bool] = None


class CharterResponse(CharterBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== ГЛАВНЫЕ РЕВМАТОЛОГИ ====================
class ChiefRheumatologistBase(BaseModel):
    last_name_ru: str
    last_name_uz: str
    last_name_en: str
    first_name_ru: str
    first_name_uz: str
    first_name_en: str
    patronymic_ru: Optional[str] = None
    patronymic_uz: Optional[str] = None
    patronymic_en: Optional[str] = None
    position_ru: Optional[str] = None
    position_uz: Optional[str] = None
    position_en: Optional[str] = None
    degree_ru: Optional[str] = None
    degree_uz: Optional[str] = None
    degree_en: Optional[str] = None
    region_ru: Optional[str] = None
    region_uz: Optional[str] = None
    region_en: Optional[str] = None
    workplace_ru: Optional[str] = None
    workplace_uz: Optional[str] = None
    workplace_en: Optional[str] = None
    bio_ru: Optional[str] = None
    bio_uz: Optional[str] = None
    bio_en: Optional[str] = None
    photo_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    order: int = 0
    is_active: bool = True


class ChiefRheumatologistCreate(ChiefRheumatologistBase):
    pass


class ChiefRheumatologistUpdate(BaseModel):
    last_name_ru: Optional[str] = None
    last_name_uz: Optional[str] = None
    last_name_en: Optional[str] = None
    first_name_ru: Optional[str] = None
    first_name_uz: Optional[str] = None
    first_name_en: Optional[str] = None
    patronymic_ru: Optional[str] = None
    patronymic_uz: Optional[str] = None
    patronymic_en: Optional[str] = None
    position_ru: Optional[str] = None
    position_uz: Optional[str] = None
    position_en: Optional[str] = None
    degree_ru: Optional[str] = None
    degree_uz: Optional[str] = None
    degree_en: Optional[str] = None
    region_ru: Optional[str] = None
    region_uz: Optional[str] = None
    region_en: Optional[str] = None
    workplace_ru: Optional[str] = None
    workplace_uz: Optional[str] = None
    workplace_en: Optional[str] = None
    bio_ru: Optional[str] = None
    bio_uz: Optional[str] = None
    bio_en: Optional[str] = None
    photo_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class ChiefRheumatologistResponse(ChiefRheumatologistBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== ЗАБОЛЕВАНИЯ ====================
class DiseaseBase(BaseModel):
    name_ru: str
    name_uz: str
    name_en: str
    short_name: Optional[str] = None
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    symptoms_ru: Optional[str] = None
    symptoms_uz: Optional[str] = None
    symptoms_en: Optional[str] = None
    treatment_ru: Optional[str] = None
    treatment_uz: Optional[str] = None
    treatment_en: Optional[str] = None
    image_url: Optional[str] = None
    order: int = 0
    is_active: bool = True


class DiseaseCreate(DiseaseBase):
    pass


class DiseaseUpdate(BaseModel):
    name_ru: Optional[str] = None
    name_uz: Optional[str] = None
    name_en: Optional[str] = None
    short_name: Optional[str] = None
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    symptoms_ru: Optional[str] = None
    symptoms_uz: Optional[str] = None
    symptoms_en: Optional[str] = None
    treatment_ru: Optional[str] = None
    treatment_uz: Optional[str] = None
    treatment_en: Optional[str] = None
    image_url: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class DiseaseResponse(DiseaseBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== ДОКУМЕНТЫ О ЗАБОЛЕВАНИЯХ ====================
class DiseaseDocumentBase(BaseModel):
    disease_id: Optional[int] = None
    title_ru: str
    title_uz: str
    title_en: str
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    file_url: str
    document_type: Optional[str] = None
    order: int = 0
    is_active: bool = True


class DiseaseDocumentCreate(DiseaseDocumentBase):
    pass


class DiseaseDocumentUpdate(BaseModel):
    disease_id: Optional[int] = None
    title_ru: Optional[str] = None
    title_uz: Optional[str] = None
    title_en: Optional[str] = None
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    file_url: Optional[str] = None
    document_type: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class DiseaseDocumentResponse(DiseaseDocumentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== СОТРУДНИКИ ЦЕНТРОВ ====================
class CenterStaffBase(BaseModel):
    center_id: int
    last_name_ru: str
    last_name_uz: str
    last_name_en: str
    first_name_ru: str
    first_name_uz: str
    first_name_en: str
    patronymic_ru: Optional[str] = None
    patronymic_uz: Optional[str] = None
    patronymic_en: Optional[str] = None
    position_ru: Optional[str] = None
    position_uz: Optional[str] = None
    position_en: Optional[str] = None
    credentials_ru: Optional[str] = None
    credentials_uz: Optional[str] = None
    credentials_en: Optional[str] = None
    photo_url: Optional[str] = None
    order: int = 0
    is_active: bool = True


class CenterStaffCreate(CenterStaffBase):
    pass


class CenterStaffUpdate(BaseModel):
    center_id: Optional[int] = None
    last_name_ru: Optional[str] = None
    last_name_uz: Optional[str] = None
    last_name_en: Optional[str] = None
    first_name_ru: Optional[str] = None
    first_name_uz: Optional[str] = None
    first_name_en: Optional[str] = None
    patronymic_ru: Optional[str] = None
    patronymic_uz: Optional[str] = None
    patronymic_en: Optional[str] = None
    position_ru: Optional[str] = None
    position_uz: Optional[str] = None
    position_en: Optional[str] = None
    credentials_ru: Optional[str] = None
    credentials_uz: Optional[str] = None
    credentials_en: Optional[str] = None
    photo_url: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class CenterStaffResponse(CenterStaffBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== РЕВМАТОЛОГИЧЕСКИЕ ЦЕНТРЫ ====================
class RheumatologyCenterBase(BaseModel):
    name_ru: str
    name_uz: str
    name_en: str
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    address_ru: Optional[str] = None
    address_uz: Optional[str] = None
    address_en: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    image_url: Optional[str] = None
    order: int = 0
    is_active: bool = True


class RheumatologyCenterCreate(RheumatologyCenterBase):
    pass


class RheumatologyCenterUpdate(BaseModel):
    name_ru: Optional[str] = None
    name_uz: Optional[str] = None
    name_en: Optional[str] = None
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    address_ru: Optional[str] = None
    address_uz: Optional[str] = None
    address_en: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    image_url: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class RheumatologyCenterResponse(RheumatologyCenterBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class RheumatologyCenterWithStaffResponse(RheumatologyCenterBase):
    id: int
    created_at: datetime
    staff: list[CenterStaffResponse] = []

    class Config:
        from_attributes = True


# ==================== НОВОСТИ И СОБЫТИЯ ====================
class NewsBase(BaseModel):
    news_type: str = "news"  # "news" или "event"

    # Заголовки
    title_ru: str
    title_uz: str
    title_en: str

    # Подзаголовки (для новостей)
    subtitle_ru: Optional[str] = None
    subtitle_uz: Optional[str] = None
    subtitle_en: Optional[str] = None

    # Контент
    content_ru: str
    content_uz: str
    content_en: str
    excerpt_ru: Optional[str] = None
    excerpt_uz: Optional[str] = None
    excerpt_en: Optional[str] = None

    # Картинки
    image_url: Optional[str] = None  # Основная картинка / картинка события
    background_image_url: Optional[str] = None  # Фоновая картинка для событий

    # Для событий
    event_date_start: Optional[datetime] = None  # Дата начала
    event_date_end: Optional[datetime] = None    # Дата окончания
    event_location_ru: Optional[str] = None
    event_location_uz: Optional[str] = None
    event_location_en: Optional[str] = None
    registration_url: Optional[str] = None  # Ссылка на регистрацию

    # Метаданные
    is_published: bool = False
    is_featured: bool = False  # Показывать в карусели


class NewsCreate(NewsBase):
    pass


class NewsUpdate(BaseModel):
    news_type: Optional[str] = None
    title_ru: Optional[str] = None
    title_uz: Optional[str] = None
    title_en: Optional[str] = None
    subtitle_ru: Optional[str] = None
    subtitle_uz: Optional[str] = None
    subtitle_en: Optional[str] = None
    content_ru: Optional[str] = None
    content_uz: Optional[str] = None
    content_en: Optional[str] = None
    excerpt_ru: Optional[str] = None
    excerpt_uz: Optional[str] = None
    excerpt_en: Optional[str] = None
    image_url: Optional[str] = None
    background_image_url: Optional[str] = None
    event_date_start: Optional[datetime] = None
    event_date_end: Optional[datetime] = None
    event_location_ru: Optional[str] = None
    event_location_uz: Optional[str] = None
    event_location_en: Optional[str] = None
    registration_url: Optional[str] = None
    is_published: Optional[bool] = None
    is_featured: Optional[bool] = None


class NewsResponse(NewsBase):
    id: int
    author_id: Optional[int] = None
    views_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
