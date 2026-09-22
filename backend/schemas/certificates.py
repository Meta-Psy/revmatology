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
    recipient_id: int
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
    created_at: Optional[datetime] = None


class CertificateRecipientList(BaseModel):
    items: list[CertificateRecipientResponse]
    total: int


class CertificateImportReport(BaseModel):
    accepted: int
    empty_rows: int
    duplicates_in_file: int
    skipped_existing: int
    inserted: int
    sample: list[str]
    columns: list[str]
