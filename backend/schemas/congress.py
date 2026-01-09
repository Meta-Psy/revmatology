from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class CongressCreate(BaseModel):
    title_ru: str
    title_uz: str
    title_en: str
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    program_ru: Optional[str] = None
    program_uz: Optional[str] = None
    program_en: Optional[str] = None
    date_start: Optional[datetime] = None
    date_end: Optional[datetime] = None
    location: Optional[str] = None
    image_url: Optional[str] = None


class CongressResponse(BaseModel):
    id: int
    title_ru: str
    title_uz: str
    title_en: str
    description_ru: Optional[str]
    description_uz: Optional[str]
    description_en: Optional[str]
    program_ru: Optional[str]
    program_uz: Optional[str]
    program_en: Optional[str]
    date_start: Optional[datetime]
    date_end: Optional[datetime]
    location: Optional[str]
    image_url: Optional[str]
    is_active: bool
    registration_open: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CongressRegistrationCreate(BaseModel):
    congress_id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    organization: Optional[str] = None
    position: Optional[str] = None


class CongressRegistrationResponse(BaseModel):
    id: int
    congress_id: int
    full_name: str
    email: str
    phone: Optional[str]
    organization: Optional[str]
    position: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
