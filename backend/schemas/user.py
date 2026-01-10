from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from database.models import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    last_name: str      # Фамилия
    first_name: str     # Имя
    patronymic: Optional[str] = None  # Отчество

    @field_validator('last_name', 'first_name')
    @classmethod
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Минимум 2 символа')
        return v.strip()

    @field_validator('patronymic')
    @classmethod
    def validate_patronymic(cls, v):
        if v and len(v.strip()) < 2:
            raise ValueError('Минимум 2 символа')
        return v.strip() if v else None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    last_name: str
    first_name: str
    patronymic: Optional[str] = None
    full_name: str       # Вычисляемое поле
    short_name: str      # Имя Отчество для приветствия
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[UserRole] = None
