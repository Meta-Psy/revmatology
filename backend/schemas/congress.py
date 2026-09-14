from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
# Типы импортируются под алиасами: поле `date` в моделях дней программы
# затеняет имя типа `date`, из-за чего аннотация резолвилась в NoneType.
from datetime import datetime, date as date_type, time as time_type


def _empty_str_to_none(value):
    """Формы админки шлют '' для незаполненных дат/времени — это None."""
    if isinstance(value, str) and value.strip() == "":
        return None
    return value


class BlankDatesToNone(BaseModel):
    """Базовый класс для входных схем: '' в полях дат/времени трактуется как None.

    В Update-схемах '' — это пришедшее поле (оно попадает в exclude_unset) со
    значением None, то есть очищенное поле формы очищает сохранённую дату.
    Так это и выглядит для админа, поведение намеренное.
    """

    @field_validator(
        "date", "date_start", "date_end", "time_start", "time_end",
        mode="before", check_fields=False
    )
    @classmethod
    def _blank_to_none(cls, value):
        return _empty_str_to_none(value)


# ==================== CONGRESS ====================
class CongressCreate(BlankDatesToNone):
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
    # PDF программы
    program_file_ru: Optional[str] = None
    program_file_uz: Optional[str] = None
    program_file_en: Optional[str] = None


class CongressUpdate(BlankDatesToNone):
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
    program_file_ru: Optional[str] = None
    program_file_uz: Optional[str] = None
    program_file_en: Optional[str] = None


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
    program_file_ru: Optional[str] = None
    program_file_uz: Optional[str] = None
    program_file_en: Optional[str] = None

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
class CongressProgramDayCreate(BlankDatesToNone):
    congress_id: int
    date: Optional[date_type] = None
    title_ru: str
    title_uz: str
    title_en: str
    description_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_en: Optional[str] = None
    order: int = 0


class CongressProgramDayUpdate(BlankDatesToNone):
    date: Optional[date_type] = None
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
    date: Optional[date_type] = None
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
    day_id: Optional[int] = None
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
class CongressSpeakerCreate(BlankDatesToNone):
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
    time_start: Optional[time_type] = None
    time_end: Optional[time_type] = None
    photo_url: Optional[str] = None
    order: int = 0
    is_active: bool = True


class CongressSpeakerUpdate(BlankDatesToNone):
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
    time_start: Optional[time_type] = None
    time_end: Optional[time_type] = None
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
    time_start: Optional[time_type] = None
    time_end: Optional[time_type] = None
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
