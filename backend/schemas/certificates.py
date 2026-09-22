"""Схемы выдачи сертификатов конгресса (К-11)."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

HEX_COLOR = r"^#[0-9A-Fa-f]{6}$"


# ==================== публичные ====================

class CertificateStatus(BaseModel):
    open: bool


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
    is_open: bool
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
    is_open: Optional[bool] = None
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

    @field_validator("full_name", mode="before")
    @classmethod
    def _collapse_spaces(cls, value):
        return _clean_name(value)


class CertificateRecipientUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=300)
    phone: Optional[str] = Field(None, max_length=50)

    @field_validator("full_name", mode="before")
    @classmethod
    def _collapse_spaces(cls, value):
        return _clean_name(value)


class CertificateRecipientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    phone_digits: Optional[str] = None
    download_count: int
    number: int
    created_at: Optional[datetime] = None


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
