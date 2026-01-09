from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .connection import Base
import enum


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class Language(str, enum.Enum):
    RU = "ru"
    UZ = "uz"
    EN = "en"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    title_ru = Column(String(500), nullable=False)
    title_uz = Column(String(500), nullable=False)
    title_en = Column(String(500), nullable=False)
    content_ru = Column(Text, nullable=False)
    content_uz = Column(Text, nullable=False)
    content_en = Column(Text, nullable=False)
    image_url = Column(String(500))
    is_published = Column(Boolean, default=False)
    author_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    author = relationship("User")


class Congress(Base):
    __tablename__ = "congresses"

    id = Column(Integer, primary_key=True, index=True)
    title_ru = Column(String(500), nullable=False)
    title_uz = Column(String(500), nullable=False)
    title_en = Column(String(500), nullable=False)
    description_ru = Column(Text)
    description_uz = Column(Text)
    description_en = Column(Text)
    program_ru = Column(Text)
    program_uz = Column(Text)
    program_en = Column(Text)
    date_start = Column(DateTime(timezone=True))
    date_end = Column(DateTime(timezone=True))
    location = Column(String(500))
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    registration_open = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CongressRegistration(Base):
    __tablename__ = "congress_registrations"

    id = Column(Integer, primary_key=True, index=True)
    congress_id = Column(Integer, ForeignKey("congresses.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50))
    organization = Column(String(255))
    position = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    congress = relationship("Congress")
    user = relationship("User")


class RheumatologyCenter(Base):
    __tablename__ = "rheumatology_centers"

    id = Column(Integer, primary_key=True, index=True)
    name_ru = Column(String(500), nullable=False)
    name_uz = Column(String(500), nullable=False)
    name_en = Column(String(500), nullable=False)
    description_ru = Column(Text)
    description_uz = Column(Text)
    description_en = Column(Text)
    address = Column(String(500))
    phone = Column(String(50))
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    full_name_ru = Column(String(255), nullable=False)
    full_name_uz = Column(String(255), nullable=False)
    full_name_en = Column(String(255), nullable=False)
    position_ru = Column(String(255))
    position_uz = Column(String(255))
    position_en = Column(String(255))
    degree_ru = Column(String(255))
    degree_uz = Column(String(255))
    degree_en = Column(String(255))
    photo_url = Column(String(500))
    is_chief = Column(Boolean, default=False)
    order = Column(Integer, default=0)


class Disease(Base):
    __tablename__ = "diseases"

    id = Column(Integer, primary_key=True, index=True)
    name_ru = Column(String(255), nullable=False)
    name_uz = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=False)
    short_name = Column(String(50))
    description_ru = Column(Text)
    description_uz = Column(Text)
    description_en = Column(Text)
    symptoms_ru = Column(Text)
    symptoms_uz = Column(Text)
    symptoms_en = Column(Text)
    treatment_ru = Column(Text)
    treatment_uz = Column(Text)
    treatment_en = Column(Text)
    image_url = Column(String(500))


class SchoolApplication(Base):
    __tablename__ = "school_applications"

    id = Column(Integer, primary_key=True, index=True)
    school_type = Column(String(50), nullable=False)  # 'rheumatologist' or 'patient'
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50))
    organization = Column(String(255))
    specialty = Column(String(255))
    message = Column(Text)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AssociationMember(Base):
    __tablename__ = "association_members"

    id = Column(Integer, primary_key=True, index=True)
    full_name_ru = Column(String(255), nullable=False)
    full_name_uz = Column(String(255), nullable=False)
    full_name_en = Column(String(255), nullable=False)
    position_ru = Column(String(255))
    position_uz = Column(String(255))
    position_en = Column(String(255))
    organization_ru = Column(String(255))
    organization_uz = Column(String(255))
    organization_en = Column(String(255))
    photo_url = Column(String(500))
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)


class Partner(Base):
    __tablename__ = "partners"

    id = Column(Integer, primary_key=True, index=True)
    name_ru = Column(String(255), nullable=False)
    name_uz = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=False)
    description_ru = Column(Text)
    description_uz = Column(Text)
    description_en = Column(Text)
    logo_url = Column(String(500))
    website_url = Column(String(500))
    country = Column(String(100))
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
