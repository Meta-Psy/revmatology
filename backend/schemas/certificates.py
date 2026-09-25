"""Схемы выдачи сертификатов конгресса (К-11) и личного кабинета (К-12)."""
from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from database.models import CERTIFICATE_ISSUE_MODES

HEX_COLOR = r"^#[0-9A-Fa-f]{6}$"
# от того же списка, что CHECK в БД: разойтись им нечем
IssueMode = Literal[CERTIFICATE_ISSUE_MODES]


# ==================== публичные ====================

class CertificateStatus(BaseModel):
    open: bool
    # дата автооткрытия, пока выдача закрыта (режим auto с загруженным бланком)
    opens_on: Optional[date] = None


class CertificateSuggestion(BaseModel):
    """Подсказка участнику — без телефона (ТЗ §15)."""
    id: int
    full_name: str
    needs_phone: bool


class CertificateIssueRequest(BaseModel):
    """full_name — имя из выбранной подсказки: без него перебор id отдавал бы PDF любому."""
    recipient_id: int
    full_name: str = Field(..., max_length=300)
    phone: Optional[str] = None


# ==================== админские: настройки ====================

class CertificateSettingsResponse(BaseModel):
    congress_id: int
    has_template: bool
    pdf_filename: Optional[str] = None
    box_x_mm: float
    box_y_mm: float
    box_w_mm: float
    box_h_mm: float
    font_max_pt: float
    font_min_pt: float
    text_color: str
    issue_mode: IssueMode
    # посчитанные, только для чтения: текущее состояние выдачи
    open: bool = False
    opens_on: Optional[date] = None
    number_box_x_mm: Optional[float] = None
    number_box_y_mm: Optional[float] = None
    number_box_w_mm: Optional[float] = None
    number_box_h_mm: Optional[float] = None
    number_font_pt: float
    updated_at: Optional[datetime] = None


class CertificateSettingsUpdate(BaseModel):
    box_x_mm: Optional[float] = Field(None, ge=0)
    box_y_mm: Optional[float] = Field(None, ge=0)
    box_w_mm: Optional[float] = Field(None, gt=0)
    box_h_mm: Optional[float] = Field(None, gt=0)
    font_max_pt: Optional[float] = Field(None, gt=0, le=400)
    font_min_pt: Optional[float] = Field(None, gt=0, le=400)
    text_color: Optional[str] = Field(None, pattern=HEX_COLOR)
    issue_mode: Optional[IssueMode] = None
    # рамка номера: null — «номер не печатается» (все четыре сразу), а не «не менять»
    number_box_x_mm: Optional[float] = Field(None, ge=0)
    number_box_y_mm: Optional[float] = Field(None, ge=0)
    number_box_w_mm: Optional[float] = Field(None, gt=0)
    number_box_h_mm: Optional[float] = Field(None, gt=0)
    number_font_pt: Optional[float] = Field(None, gt=0, le=400)


class CertificatePreviewRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=300)


# ==================== админские: получатели ====================

def _clean_name(value):
    if isinstance(value, str):
        value = " ".join(value.split())
    return value


class CertificateRecipientCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=300)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=255)

    @field_validator("full_name", mode="before")
    @classmethod
    def _collapse_spaces(cls, value):
        return _clean_name(value)


class CertificateRecipientUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=300)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=255)

    @field_validator("full_name", mode="before")
    @classmethod
    def _collapse_spaces(cls, value):
        return _clean_name(value)


class CertificateRecipientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    phone_digits: Optional[str] = None
    email: Optional[str] = None
    download_count: int
    number: int
    created_at: Optional[datetime] = None


class MyCertificate(BaseModel):
    """Строка кабинета (К-12): телефона здесь нет — вход уже подтверждён."""
    recipient_id: int
    congress_id: int
    congress_title_ru: str
    congress_title_uz: str
    congress_title_en: str
    full_name: str
    number: int
    downloads_left: int
    open: bool
    opens_on: Optional[date] = None


class CertificateRecipientList(BaseModel):
    items: list[CertificateRecipientResponse]
    total: int


class CertificateImportReport(BaseModel):
    accepted: int
    empty_rows: int
    duplicates_in_file: int
    skipped_existing: int
    short_phones: int  # меньше 9 цифр — сохранены без телефона
    invalid_phones: int  # больше 15 цифр — сохранены без телефона
    too_long_names: int  # имя длиннее 300 знаков — строка отброшена
    will_insert: int  # сколько строк вставится; без dry_run равно inserted
    inserted: int
    sample: list[str]
    columns: list[str]
    # replace без единого скачивания — номера заново с 1; иначе продолжаются
    numbering_restarted: bool
    first_number: int  # номер первой вставленной строки
