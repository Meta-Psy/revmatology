from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, ForeignKey, Enum, Time
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
    last_name = Column(String(100), nullable=False)      # Фамилия
    first_name = Column(String(100), nullable=False)     # Имя
    patronymic = Column(String(100), nullable=True)      # Отчество (может отсутствовать)
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @property
    def full_name(self):
        """Полное ФИО"""
        if self.patronymic:
            return f"{self.last_name} {self.first_name} {self.patronymic}"
        return f"{self.last_name} {self.first_name}"

    @property
    def short_name(self):
        """Имя Отчество (для приветствия)"""
        if self.patronymic:
            return f"{self.first_name} {self.patronymic}"
        return self.first_name


# ==================== НОВОСТИ И СОБЫТИЯ ====================
class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    news_type = Column(String(20), default="news")  # "news" или "event"

    # Общие поля
    title_ru = Column(String(500), nullable=False)
    title_uz = Column(String(500), nullable=False)
    title_en = Column(String(500), nullable=False)

    # Для новостей - подзаголовок
    subtitle_ru = Column(String(500), nullable=True)
    subtitle_uz = Column(String(500), nullable=True)
    subtitle_en = Column(String(500), nullable=True)

    content_ru = Column(Text, nullable=False)
    content_uz = Column(Text, nullable=False)
    content_en = Column(Text, nullable=False)
    excerpt_ru = Column(Text)  # Краткое описание для превью
    excerpt_uz = Column(Text)
    excerpt_en = Column(Text)

    # Картинки
    image_url = Column(String(500))  # Основная картинка (для новостей) / картинка события
    background_image_url = Column(String(500))  # Фоновая картинка для событий

    # Для событий
    event_date_start = Column(DateTime(timezone=True), nullable=True)  # Дата начала события
    event_date_end = Column(DateTime(timezone=True), nullable=True)    # Дата окончания события
    event_location_ru = Column(String(500), nullable=True)
    event_location_uz = Column(String(500), nullable=True)
    event_location_en = Column(String(500), nullable=True)
    registration_url = Column(String(500), nullable=True)  # Ссылка на форму регистрации

    # Метаданные
    is_published = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)  # Показывать в карусели
    views_count = Column(Integer, default=0)
    author_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    author = relationship("User")


# ==================== КОНГРЕСС ====================
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
    location_ru = Column(String(500))
    location_uz = Column(String(500))
    location_en = Column(String(500))
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    registration_open = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Вкладка "О конгрессе"
    about_ru = Column(Text)
    about_uz = Column(Text)
    about_en = Column(Text)

    # Вкладка "Организаторы"
    organizers_ru = Column(Text)
    organizers_uz = Column(Text)
    organizers_en = Column(Text)

    # Вкладка "Конкурс молодых ученых"
    young_scientists_ru = Column(Text)
    young_scientists_uz = Column(Text)
    young_scientists_en = Column(Text)

    # Контакты (3 типа)
    contact_publications_phone = Column(String(50))
    contact_publications_email = Column(String(255))
    contact_registration_phone = Column(String(50))
    contact_registration_email = Column(String(255))
    contact_participation_phone = Column(String(50))
    contact_participation_email = Column(String(255))

    # Информационное письмо
    info_letter_ru = Column(Text)
    info_letter_uz = Column(Text)
    info_letter_en = Column(Text)
    info_letter_file_ru = Column(String(500))
    info_letter_file_uz = Column(String(500))
    info_letter_file_en = Column(String(500))

    # Связи
    sponsors = relationship("CongressSponsor", back_populates="congress", cascade="all, delete-orphan", order_by="CongressSponsor.order")
    program_days = relationship("CongressProgramDay", back_populates="congress", cascade="all, delete-orphan", order_by="CongressProgramDay.order")
    speakers = relationship("CongressSpeaker", back_populates="congress", cascade="all, delete-orphan", order_by="CongressSpeaker.order")
    registrations = relationship("CongressRegistration", back_populates="congress", cascade="all, delete-orphan")


class CongressRegistration(Base):
    __tablename__ = "congress_registrations"

    id = Column(Integer, primary_key=True, index=True)
    congress_id = Column(Integer, ForeignKey("congresses.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    last_name = Column(String(100), nullable=False)
    first_name = Column(String(100), nullable=False)
    patronymic = Column(String(100))
    email = Column(String(255), nullable=False)
    phone = Column(String(50))
    organization = Column(String(255))
    position = Column(String(255))
    academic_degree = Column(String(100))
    academic_title = Column(String(100))
    institution_address = Column(String(500))
    participation_form = Column(String(50))  # publication / oral_presentation / participation
    report_title = Column(String(500))
    is_young_scientist = Column(Boolean, default=False)
    needs_hotel = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    congress = relationship("Congress", back_populates="registrations")
    user = relationship("User")


# ==================== СПОНСОРЫ КОНГРЕССА ====================
class CongressSponsor(Base):
    __tablename__ = "congress_sponsors"

    id = Column(Integer, primary_key=True, index=True)
    congress_id = Column(Integer, ForeignKey("congresses.id"), nullable=False)
    name_ru = Column(String(255), nullable=False)
    name_uz = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=False)
    description_ru = Column(Text)
    description_uz = Column(Text)
    description_en = Column(Text)
    logo_url = Column(String(500))
    website_url = Column(String(500))
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    congress = relationship("Congress", back_populates="sponsors")


# ==================== ПРОГРАММА КОНГРЕССА: ДНИ ====================
class CongressProgramDay(Base):
    __tablename__ = "congress_program_days"

    id = Column(Integer, primary_key=True, index=True)
    congress_id = Column(Integer, ForeignKey("congresses.id"), nullable=False)
    date = Column(Date, nullable=True)
    title_ru = Column(String(500), nullable=False)
    title_uz = Column(String(500), nullable=False)
    title_en = Column(String(500), nullable=False)
    description_ru = Column(Text)
    description_uz = Column(Text)
    description_en = Column(Text)
    order = Column(Integer, default=0)

    congress = relationship("Congress", back_populates="program_days")
    sections = relationship("CongressProgramSection", back_populates="day", cascade="all, delete-orphan", order_by="CongressProgramSection.order")


# ==================== ПРОГРАММА КОНГРЕССА: СЕКЦИИ ====================
class CongressProgramSection(Base):
    __tablename__ = "congress_program_sections"

    id = Column(Integer, primary_key=True, index=True)
    day_id = Column(Integer, ForeignKey("congress_program_days.id"), nullable=False)
    title_ru = Column(String(500), nullable=False)
    title_uz = Column(String(500), nullable=False)
    title_en = Column(String(500), nullable=False)
    description_ru = Column(Text)
    description_uz = Column(Text)
    description_en = Column(Text)
    order = Column(Integer, default=0)

    day = relationship("CongressProgramDay", back_populates="sections")
    speakers = relationship("CongressSpeaker", back_populates="section", order_by="CongressSpeaker.order")


# ==================== СПИКЕРЫ КОНГРЕССА ====================
class CongressSpeaker(Base):
    __tablename__ = "congress_speakers"

    id = Column(Integer, primary_key=True, index=True)
    congress_id = Column(Integer, ForeignKey("congresses.id"), nullable=False)
    section_id = Column(Integer, ForeignKey("congress_program_sections.id"), nullable=True)

    last_name_ru = Column(String(100), nullable=False)
    last_name_uz = Column(String(100), nullable=False)
    last_name_en = Column(String(100), nullable=False)
    first_name_ru = Column(String(100), nullable=False)
    first_name_uz = Column(String(100), nullable=False)
    first_name_en = Column(String(100), nullable=False)
    patronymic_ru = Column(String(100))
    patronymic_uz = Column(String(100))
    patronymic_en = Column(String(100))

    degree_ru = Column(String(255))
    degree_uz = Column(String(255))
    degree_en = Column(String(255))
    workplace_ru = Column(Text)
    workplace_uz = Column(Text)
    workplace_en = Column(Text)
    topic_ru = Column(String(500))
    topic_uz = Column(String(500))
    topic_en = Column(String(500))

    time_start = Column(Time, nullable=True)
    time_end = Column(Time, nullable=True)
    photo_url = Column(String(500))
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    congress = relationship("Congress", back_populates="speakers")
    section = relationship("CongressProgramSection", back_populates="speakers")


# ==================== ЧЛЕНЫ ПРАВЛЕНИЯ ====================
class BoardMember(Base):
    __tablename__ = "board_members"

    id = Column(Integer, primary_key=True, index=True)
    last_name_ru = Column(String(100), nullable=False)
    last_name_uz = Column(String(100), nullable=False)
    last_name_en = Column(String(100), nullable=False)
    first_name_ru = Column(String(100), nullable=False)
    first_name_uz = Column(String(100), nullable=False)
    first_name_en = Column(String(100), nullable=False)
    patronymic_ru = Column(String(100))
    patronymic_uz = Column(String(100))
    patronymic_en = Column(String(100))
    position_ru = Column(String(255))  # Должность в ассоциации (Председатель, и т.д.)
    position_uz = Column(String(255))
    position_en = Column(String(255))
    degree_ru = Column(String(255))    # Учёная степень (д.м.н., профессор)
    degree_uz = Column(String(255))
    degree_en = Column(String(255))
    workplace_ru = Column(Text)        # Место работы, должность
    workplace_uz = Column(Text)
    workplace_en = Column(Text)
    bio_ru = Column(Text)              # Краткая биография
    bio_uz = Column(Text)
    bio_en = Column(Text)
    achievements_ru = Column(Text)      # Достижения, награды, регалии
    achievements_uz = Column(Text)
    achievements_en = Column(Text)
    photo_url = Column(String(500))
    email = Column(String(255))
    phone = Column(String(50))
    order = Column(Integer, default=0)  # Порядок отображения
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==================== МЕЖДУНАРОДНЫЕ ПАРТНЁРЫ ====================
class Partner(Base):
    __tablename__ = "partners"

    id = Column(Integer, primary_key=True, index=True)
    name_ru = Column(String(255), nullable=False)
    name_uz = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=False)
    short_name = Column(String(50))  # Аббревиатура (EULAR, APLAR, АРР)
    description_ru = Column(Text)
    description_uz = Column(Text)
    description_en = Column(Text)
    logo_url = Column(String(500))
    website_url = Column(String(500))
    country_ru = Column(String(100))
    country_uz = Column(String(100))
    country_en = Column(String(100))
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==================== УСТАВ ====================
class Charter(Base):
    __tablename__ = "charters"

    id = Column(Integer, primary_key=True, index=True)
    title_ru = Column(String(255), nullable=False)
    title_uz = Column(String(255), nullable=False)
    title_en = Column(String(255), nullable=False)
    description_ru = Column(Text)
    description_uz = Column(Text)
    description_en = Column(Text)
    file_url = Column(String(500), nullable=False)
    version = Column(String(50))  # Версия документа
    is_active = Column(Boolean, default=True)  # Только один может быть активным
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# ==================== ГЛАВНЫЕ РЕВМАТОЛОГИ ====================
class ChiefRheumatologist(Base):
    __tablename__ = "chief_rheumatologists"

    id = Column(Integer, primary_key=True, index=True)
    last_name_ru = Column(String(100), nullable=False)
    last_name_uz = Column(String(100), nullable=False)
    last_name_en = Column(String(100), nullable=False)
    first_name_ru = Column(String(100), nullable=False)
    first_name_uz = Column(String(100), nullable=False)
    first_name_en = Column(String(100), nullable=False)
    patronymic_ru = Column(String(100))
    patronymic_uz = Column(String(100))
    patronymic_en = Column(String(100))
    position_ru = Column(String(255))  # Должность
    position_uz = Column(String(255))
    position_en = Column(String(255))
    degree_ru = Column(String(255))    # Учёная степень
    degree_uz = Column(String(255))
    degree_en = Column(String(255))
    region_ru = Column(String(255))    # Регион/область
    region_uz = Column(String(255))
    region_en = Column(String(255))
    workplace_ru = Column(Text)
    workplace_uz = Column(Text)
    workplace_en = Column(Text)
    bio_ru = Column(Text)
    bio_uz = Column(Text)
    bio_en = Column(Text)
    achievements_ru = Column(Text)      # Достижения, награды
    achievements_uz = Column(Text)
    achievements_en = Column(Text)
    photo_url = Column(String(500))
    email = Column(String(255))
    phone = Column(String(50))
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==================== РЕВМАТОЛОГИЧЕСКИЕ ЦЕНТРЫ ====================
class RheumatologyCenter(Base):
    __tablename__ = "rheumatology_centers"

    id = Column(Integer, primary_key=True, index=True)
    name_ru = Column(String(500), nullable=False)
    name_uz = Column(String(500), nullable=False)
    name_en = Column(String(500), nullable=False)
    description_ru = Column(Text)
    description_uz = Column(Text)
    description_en = Column(Text)
    address_ru = Column(String(500))
    address_uz = Column(String(500))
    address_en = Column(String(500))
    phone = Column(String(50))
    email = Column(String(255))
    website = Column(String(500))
    image_url = Column(String(500))
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to staff
    staff = relationship("CenterStaff", back_populates="center", cascade="all, delete-orphan")


# ==================== СОТРУДНИКИ ЦЕНТРОВ ====================
class CenterStaff(Base):
    __tablename__ = "center_staff"

    id = Column(Integer, primary_key=True, index=True)
    center_id = Column(Integer, ForeignKey("rheumatology_centers.id"), nullable=False)

    last_name_ru = Column(String(100), nullable=False)
    last_name_uz = Column(String(100), nullable=False)
    last_name_en = Column(String(100), nullable=False)
    first_name_ru = Column(String(100), nullable=False)
    first_name_uz = Column(String(100), nullable=False)
    first_name_en = Column(String(100), nullable=False)
    patronymic_ru = Column(String(100))
    patronymic_uz = Column(String(100))
    patronymic_en = Column(String(100))
    position_ru = Column(String(255))  # Должность в центре
    position_uz = Column(String(255))
    position_en = Column(String(255))
    credentials_ru = Column(String(500))  # Регалии (д.м.н., профессор, к.м.н.)
    credentials_uz = Column(String(500))
    credentials_en = Column(String(500))
    photo_url = Column(String(500))
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    center = relationship("RheumatologyCenter", back_populates="staff")


# ==================== ЗАБОЛЕВАНИЯ ====================
class Disease(Base):
    __tablename__ = "diseases"

    id = Column(Integer, primary_key=True, index=True)
    name_ru = Column(String(255), nullable=False)
    name_uz = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=False)
    short_name = Column(String(50))  # Аббревиатура (РА, СКВ)
    description_ru = Column(Text)
    description_uz = Column(Text)
    description_en = Column(Text)
    symptoms_ru = Column(Text)
    symptoms_uz = Column(Text)
    symptoms_en = Column(Text)
    treatment_ru = Column(Text)
    treatment_uz = Column(Text)
    treatment_en = Column(Text)
    content_ru = Column(Text)  # Rich text / HTML контент
    content_uz = Column(Text)
    content_en = Column(Text)
    image_url = Column(String(500))
    recommendation_file_url = Column(String(500))  # Клинические рекомендации (PDF)
    protocol_file_url = Column(String(500))  # Клинический протокол (PDF)
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==================== ДОКУМЕНТЫ О ЗАБОЛЕВАНИЯХ (устаревшее) ====================
class DiseaseDocument(Base):
    __tablename__ = "disease_documents"

    id = Column(Integer, primary_key=True, index=True)
    disease_id = Column(Integer, ForeignKey("diseases.id"), nullable=True)  # Может быть общим документом
    title_ru = Column(String(255), nullable=False)
    title_uz = Column(String(255), nullable=False)
    title_en = Column(String(255), nullable=False)
    description_ru = Column(Text)
    description_uz = Column(Text)
    description_en = Column(Text)
    file_url = Column(String(500), nullable=False)
    document_type = Column(String(50))  # guideline, info, research
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    disease = relationship("Disease")


# ==================== ШКОЛА РЕВМАТОЛОГОВ ====================
class SchoolApplication(Base):
    __tablename__ = "school_applications"

    id = Column(Integer, primary_key=True, index=True)
    school_type = Column(String(50), default="rheumatologist")  # 'rheumatologist' or 'patient'
    event_id = Column(Integer, nullable=True)  # ID события/школы (опционально)
    last_name = Column(String(100), nullable=False)
    first_name = Column(String(100), nullable=False)
    patronymic = Column(String(100))
    phone = Column(String(50), nullable=False)
    city = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # highest, first, second, third, none
    inn = Column(String(50), nullable=False)
    email = Column(String(255), nullable=False)
    specialization = Column(String(255), nullable=False)
    workplace = Column(String(500), nullable=False)
    message = Column(Text)
    status = Column(String(50), default="pending")  # pending, approved, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==================== ОБРАЗОВАТЕЛЬНЫЕ МЕРОПРИЯТИЯ ====================
class EducationEvent(Base):
    __tablename__ = "education_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(20), nullable=False)  # "masterclass" / "webinar"

    title_ru = Column(String(500), nullable=False)
    title_uz = Column(String(500), nullable=False)
    title_en = Column(String(500), nullable=False)
    description_ru = Column(Text)
    description_uz = Column(Text)
    description_en = Column(Text)
    program_ru = Column(Text)
    program_uz = Column(Text)
    program_en = Column(Text)
    location_ru = Column(String(500))
    location_uz = Column(String(500))
    location_en = Column(String(500))
    speaker_ru = Column(String(500))
    speaker_uz = Column(String(500))
    speaker_en = Column(String(500))

    date_start = Column(DateTime(timezone=True))
    date_end = Column(DateTime(timezone=True))
    image_url = Column(String(500))
    registration_url = Column(String(500))
    registration_open = Column(Boolean, default=True)
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==================== МЕДИАРЕСУРСЫ ====================
class MediaResource(Base):
    __tablename__ = "media_resources"

    id = Column(Integer, primary_key=True, index=True)
    resource_type = Column(String(20), nullable=False)  # "journal" / "article" / "book"

    title_ru = Column(String(500), nullable=False)
    title_uz = Column(String(500), nullable=False)
    title_en = Column(String(500), nullable=False)
    description_ru = Column(Text)
    description_uz = Column(Text)
    description_en = Column(Text)
    author_name_ru = Column(String(255))
    author_name_uz = Column(String(255))
    author_name_en = Column(String(255))

    file_url = Column(String(500))
    external_url = Column(String(500))
    image_url = Column(String(500))
    published_date = Column(DateTime(timezone=True))
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==================== ИСТОРИЯ АССОЦИАЦИИ ====================
class HistoryContent(Base):
    __tablename__ = "history_content"

    id = Column(Integer, primary_key=True, index=True)
    title_ru = Column(String(500))
    title_uz = Column(String(500))
    title_en = Column(String(500))
    content_ru = Column(Text)
    content_uz = Column(Text)
    content_en = Column(Text)
    image_url = Column(String(500))
    year = Column(Integer)
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==================== HERO-ИЗОБРАЖЕНИЯ ====================
class HeroImage(Base):
    __tablename__ = "hero_images"

    id = Column(Integer, primary_key=True, index=True)
    page_key = Column(String(100), unique=True, index=True)
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
