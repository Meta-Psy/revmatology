from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# Centers
class CenterCreate(BaseModel):
    name_ru: str
    name_uz: str
    name_en: str
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    image_url: Optional[str] = None


class CenterResponse(BaseModel):
    id: int
    name_ru: str
    name_uz: str
    name_en: str
    description_ru: Optional[str]
    description_uz: Optional[str]
    description_en: Optional[str]
    address: Optional[str]
    phone: Optional[str]
    image_url: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


# Doctors
class DoctorCreate(BaseModel):
    full_name_ru: str
    full_name_uz: str
    full_name_en: str
    position_ru: Optional[str] = None
    position_uz: Optional[str] = None
    position_en: Optional[str] = None
    degree_ru: Optional[str] = None
    degree_uz: Optional[str] = None
    degree_en: Optional[str] = None
    photo_url: Optional[str] = None
    is_chief: bool = False
    order: int = 0


class DoctorResponse(BaseModel):
    id: int
    full_name_ru: str
    full_name_uz: str
    full_name_en: str
    position_ru: Optional[str]
    position_uz: Optional[str]
    position_en: Optional[str]
    degree_ru: Optional[str]
    degree_uz: Optional[str]
    degree_en: Optional[str]
    photo_url: Optional[str]
    is_chief: bool
    order: int

    class Config:
        from_attributes = True


# Diseases
class DiseaseCreate(BaseModel):
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
    recommendation_file_url: Optional[str] = None
    protocol_file_url: Optional[str] = None


class DiseaseResponse(BaseModel):
    id: int
    name_ru: str
    name_uz: str
    name_en: str
    short_name: Optional[str]
    description_ru: Optional[str]
    description_uz: Optional[str]
    description_en: Optional[str]
    symptoms_ru: Optional[str]
    symptoms_uz: Optional[str]
    symptoms_en: Optional[str]
    treatment_ru: Optional[str]
    treatment_uz: Optional[str]
    treatment_en: Optional[str]
    image_url: Optional[str]
    recommendation_file_url: Optional[str]
    protocol_file_url: Optional[str]

    class Config:
        from_attributes = True


# School Applications
class SchoolApplicationCreate(BaseModel):
    school_type: str = "rheumatologist"  # 'rheumatologist' or 'patient'
    event_id: Optional[int] = None  # ID события/школы
    last_name: str
    first_name: str
    patronymic: Optional[str] = None
    phone: str
    city: str
    category: str  # highest, first, second, third, none
    inn: str
    email: EmailStr
    specialization: str
    workplace: str
    message: Optional[str] = None


class SchoolApplicationResponse(BaseModel):
    id: int
    school_type: str
    event_id: Optional[int]
    last_name: str
    first_name: str
    patronymic: Optional[str]
    phone: str
    city: str
    category: str
    inn: str
    email: str
    specialization: str
    workplace: str
    message: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
