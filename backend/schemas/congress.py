from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date, time


# ==================== CONGRESS ====================
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
    location_ru: Optional[str] = None
    location_uz: Optional[str] = None
    location_en: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    registration_open: bool = True
    # Вкладки
    about_ru: Optional[str] = None
    about_uz: Optional[str] = None
    about_en: Optional[str] = None
    organizers_ru: Optional[str] = None
    organizers_uz: Optional[str] = None
    organizers_en: Optional[str] = None
    young_scientists_ru: Optional[str] = None
    young_scientists_uz: Optional[str] = None
    young_scientists_en: Optional[str] = None
    # Контакты
    contact_publications_phone: Optional[str] = None
    contact_publications_email: Optional[str] = None
    contact_registration_phone: Optional[str] = None
    contact_registration_email: Optional[str] = None
    contact_participation_phone: Optional[str] = None
    contact_participation_email: Optional[str] = None
    # Информационное письмо
    info_letter_ru: Optional[str] = None
    info_letter_uz: Optional[str] = None
    info_letter_en: Optional[str] = None
    info_letter_file_ru: Optional[str] = None
    info_letter_file_uz: Optional[str] = None
    info_letter_file_en: Optional[str] = None


class CongressUpdate(BaseModel):
    title_ru: Optional[str] = None
    title_uz: Optional[str] = None
    title_en: Optional[str] = None
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    program_ru: Optional[str] = None
    program_uz: Optional[str] = None
    program_en: Optional[str] = None
    date_start: Optional[datetime] = None
    date_end: Optional[datetime] = None
    location_ru: Optional[str] = None
    location_uz: Optional[str] = None
    location_en: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    registration_open: Optional[bool] = None
    about_ru: Optional[str] = None
    about_uz: Optional[str] = None
    about_en: Optional[str] = None
    organizers_ru: Optional[str] = None
    organizers_uz: Optional[str] = None
    organizers_en: Optional[str] = None
    young_scientists_ru: Optional[str] = None
    young_scientists_uz: Optional[str] = None
    young_scientists_en: Optional[str] = None
    contact_publications_phone: Optional[str] = None
    contact_publications_email: Optional[str] = None
    contact_registration_phone: Optional[str] = None
    contact_registration_email: Optional[str] = None
    contact_participation_phone: Optional[str] = None
    contact_participation_email: Optional[str] = None
    info_letter_ru: Optional[str] = None
    info_letter_uz: Optional[str] = None
    info_letter_en: Optional[str] = None
    info_letter_file_ru: Optional[str] = None
    info_letter_file_uz: Optional[str] = None
    info_letter_file_en: Optional[str] = None


class CongressResponse(BaseModel):
    id: int
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
    location_ru: Optional[str] = None
    location_uz: Optional[str] = None
    location_en: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool
    registration_open: bool
    created_at: datetime
    about_ru: Optional[str] = None
    about_uz: Optional[str] = None
    about_en: Optional[str] = None
    organizers_ru: Optional[str] = None
    organizers_uz: Optional[str] = None
    organizers_en: Optional[str] = None
    young_scientists_ru: Optional[str] = None
    young_scientists_uz: Optional[str] = None
    young_scientists_en: Optional[str] = None
    contact_publications_phone: Optional[str] = None
    contact_publications_email: Optional[str] = None
    contact_registration_phone: Optional[str] = None
    contact_registration_email: Optional[str] = None
    contact_participation_phone: Optional[str] = None
    contact_participation_email: Optional[str] = None
    info_letter_ru: Optional[str] = None
    info_letter_uz: Optional[str] = None
    info_letter_en: Optional[str] = None
    info_letter_file_ru: Optional[str] = None
    info_letter_file_uz: Optional[str] = None
    info_letter_file_en: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== CONGRESS SPONSOR ====================
class CongressSponsorCreate(BaseModel):
    congress_id: int
    name_ru: str
    name_uz: str
    name_en: str
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    order: int = 0
    is_active: bool = True


class CongressSponsorUpdate(BaseModel):
    name_ru: Optional[str] = None
    name_uz: Optional[str] = None
    name_en: Optional[str] = None
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class CongressSponsorResponse(BaseModel):
    id: int
    congress_id: int
    name_ru: str
    name_uz: str
    name_en: str
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    order: int
    is_active: bool

    class Config:
        from_attributes = True


# ==================== CONGRESS PROGRAM DAY ====================
class CongressProgramDayCreate(BaseModel):
    congress_id: int
    date: Optional[date] = None
    title_ru: str
    title_uz: str
    title_en: str
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    order: int = 0


class CongressProgramDayUpdate(BaseModel):
    date: Optional[date] = None
    title_ru: Optional[str] = None
    title_uz: Optional[str] = None
    title_en: Optional[str] = None
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    order: Optional[int] = None


class CongressProgramDayResponse(BaseModel):
    id: int
    congress_id: int
    date: Optional[date] = None
    title_ru: str
    title_uz: str
    title_en: str
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    order: int

    class Config:
        from_attributes = True


# ==================== CONGRESS PROGRAM SECTION ====================
class CongressProgramSectionCreate(BaseModel):
    day_id: int
    title_ru: str
    title_uz: str
    title_en: str
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    order: int = 0


class CongressProgramSectionUpdate(BaseModel):
    title_ru: Optional[str] = None
    title_uz: Optional[str] = None
    title_en: Optional[str] = None
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    order: Optional[int] = None


class CongressProgramSectionResponse(BaseModel):
    id: int
    day_id: int
    title_ru: str
    title_uz: str
    title_en: str
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    order: int

    class Config:
        from_attributes = True


# ==================== CONGRESS SPEAKER ====================
class CongressSpeakerCreate(BaseModel):
    congress_id: int
    section_id: Optional[int] = None
    last_name_ru: str
    last_name_uz: str
    last_name_en: str
    first_name_ru: str
    first_name_uz: str
    first_name_en: str
    patronymic_ru: Optional[str] = None
    patronymic_uz: Optional[str] = None
    patronymic_en: Optional[str] = None
    degree_ru: Optional[str] = None
    degree_uz: Optional[str] = None
    degree_en: Optional[str] = None
    workplace_ru: Optional[str] = None
    workplace_uz: Optional[str] = None
    workplace_en: Optional[str] = None
    topic_ru: Optional[str] = None
    topic_uz: Optional[str] = None
    topic_en: Optional[str] = None
    time_start: Optional[time] = None
    time_end: Optional[time] = None
    photo_url: Optional[str] = None
    order: int = 0
    is_active: bool = True


class CongressSpeakerUpdate(BaseModel):
    section_id: Optional[int] = None
    last_name_ru: Optional[str] = None
    last_name_uz: Optional[str] = None
    last_name_en: Optional[str] = None
    first_name_ru: Optional[str] = None
    first_name_uz: Optional[str] = None
    first_name_en: Optional[str] = None
    patronymic_ru: Optional[str] = None
    patronymic_uz: Optional[str] = None
    patronymic_en: Optional[str] = None
    degree_ru: Optional[str] = None
    degree_uz: Optional[str] = None
    degree_en: Optional[str] = None
    workplace_ru: Optional[str] = None
    workplace_uz: Optional[str] = None
    workplace_en: Optional[str] = None
    topic_ru: Optional[str] = None
    topic_uz: Optional[str] = None
    topic_en: Optional[str] = None
    time_start: Optional[time] = None
    time_end: Optional[time] = None
    photo_url: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class CongressSpeakerResponse(BaseModel):
    id: int
    congress_id: int
    section_id: Optional[int] = None
    last_name_ru: str
    last_name_uz: str
    last_name_en: str
    first_name_ru: str
    first_name_uz: str
    first_name_en: str
    patronymic_ru: Optional[str] = None
    patronymic_uz: Optional[str] = None
    patronymic_en: Optional[str] = None
    degree_ru: Optional[str] = None
    degree_uz: Optional[str] = None
    degree_en: Optional[str] = None
    workplace_ru: Optional[str] = None
    workplace_uz: Optional[str] = None
    workplace_en: Optional[str] = None
    topic_ru: Optional[str] = None
    topic_uz: Optional[str] = None
    topic_en: Optional[str] = None
    time_start: Optional[time] = None
    time_end: Optional[time] = None
    photo_url: Optional[str] = None
    order: int
    is_active: bool

    class Config:
        from_attributes = True


# ==================== NESTED DETAIL RESPONSES ====================
class SectionWithSpeakers(CongressProgramSectionResponse):
    speakers: List[CongressSpeakerResponse] = []


class DayWithSections(CongressProgramDayResponse):
    sections: List[SectionWithSpeakers] = []


class CongressDetailResponse(CongressResponse):
    sponsors: List[CongressSponsorResponse] = []
    program_days: List[DayWithSections] = []
    speakers: List[CongressSpeakerResponse] = []


# ==================== CONGRESS REGISTRATION ====================
class CongressRegistrationCreate(BaseModel):
    congress_id: int
    last_name: str
    first_name: str
    patronymic: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    organization: Optional[str] = None
    position: Optional[str] = None
    academic_degree: Optional[str] = None
    academic_title: Optional[str] = None
    institution_address: Optional[str] = None
    participation_form: Optional[str] = None
    report_title: Optional[str] = None
    is_young_scientist: bool = False
    needs_hotel: bool = False


class CongressRegistrationResponse(BaseModel):
    id: int
    congress_id: int
    last_name: str
    first_name: str
    patronymic: Optional[str] = None
    email: str
    phone: Optional[str] = None
    organization: Optional[str] = None
    position: Optional[str] = None
    academic_degree: Optional[str] = None
    academic_title: Optional[str] = None
    institution_address: Optional[str] = None
    participation_form: Optional[str] = None
    report_title: Optional[str] = None
    is_young_scientist: bool = False
    needs_hotel: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
