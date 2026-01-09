from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NewsCreate(BaseModel):
    title_ru: str
    title_uz: str
    title_en: str
    content_ru: str
    content_uz: str
    content_en: str
    image_url: Optional[str] = None
    is_published: bool = False


class NewsUpdate(BaseModel):
    title_ru: Optional[str] = None
    title_uz: Optional[str] = None
    title_en: Optional[str] = None
    content_ru: Optional[str] = None
    content_uz: Optional[str] = None
    content_en: Optional[str] = None
    image_url: Optional[str] = None
    is_published: Optional[bool] = None


class NewsResponse(BaseModel):
    id: int
    title_ru: str
    title_uz: str
    title_en: str
    content_ru: str
    content_uz: str
    content_en: str
    image_url: Optional[str]
    is_published: bool
    author_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
