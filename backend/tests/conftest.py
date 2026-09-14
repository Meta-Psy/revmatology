"""Общие фикстуры для тестов бэкенда.

БД для тестов — SQLite в памяти (aiosqlite) со StaticPool, чтобы все сессии
работали с одним и тем же соединением. DATABASE_URL подменяется ДО импорта
config/database/main: в pydantic-settings переменные окружения имеют приоритет
над .env-файлом.
"""
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ.setdefault("SECRET_KEY", "test-secret-key")

# main.py создаёт папку uploads относительно cwd — фиксируем cwd на backend/
os.chdir(BACKEND_DIR)

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from database import get_db  # noqa: E402
from database.connection import Base  # noqa: E402
from database.models import Congress, CongressProgramDay, CongressProgramSection, User, UserRole  # noqa: E402
from functions.auth import get_current_admin, get_current_admin_user  # noqa: E402
from main import app  # noqa: E402
from api import congress as congress_api  # noqa: E402


@pytest.fixture(autouse=True)
def pdf_renders(monkeypatch):
    """Сохранение конгресса с /uploads/*.pdf ставит фоновое рисование страниц
    (К-08) — в тестах вместо процесса только запоминаем путь. Тесты самого
    запускателя берут настоящую функцию по прямой ссылке."""
    launched = []

    async def _record(pdf_path):
        launched.append(pdf_path)

    monkeypatch.setattr(congress_api, "launch_pdf_render", _record)
    return launched


@pytest_asyncio.fixture
async def engine():
    """Чистая БД на каждый тест."""
    eng = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await eng.dispose()


@pytest_asyncio.fixture
async def session_factory(engine):
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def db_session(session_factory):
    """Сессия для подготовки данных напрямую через ORM."""
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(session_factory):
    """HTTP-клиент к приложению с подменёнными БД и админ-зависимостями.

    Lifespan не запускается: он бы дёрнул create_all на настоящем движке.
    """
    async def override_get_db():
        async with session_factory() as session:
            yield session

    admin_user = User(
        id=1,
        email="admin@test.local",
        hashed_password="not-a-real-hash",
        last_name="Тестов",
        first_name="Админ",
        role=UserRole.ADMIN,
        is_active=True,
    )

    async def override_admin():
        return admin_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_admin] = override_admin
    app.dependency_overrides[get_current_admin_user] = override_admin

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as http_client:
        yield http_client

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def make_congress(db_session):
    """Фабрика конгрессов (через ORM)."""
    async def _make_congress(title_ru="Тестовый конгресс"):
        item = Congress(title_ru=title_ru, title_uz=title_ru, title_en=title_ru)
        db_session.add(item)
        await db_session.commit()
        await db_session.refresh(item)
        return item

    return _make_congress


@pytest_asyncio.fixture
async def congress(make_congress):
    """Конгресс, созданный напрямую через ORM."""
    return await make_congress()


@pytest_asyncio.fixture
async def make_day(db_session):
    """Фабрика дней программы (через ORM)."""
    async def _make_day(congress_id: int, *, date=None, title_ru="День", order=0):
        day = CongressProgramDay(
            congress_id=congress_id,
            date=date,
            title_ru=title_ru,
            title_uz=title_ru,
            title_en=title_ru,
            order=order,
        )
        db_session.add(day)
        await db_session.commit()
        await db_session.refresh(day)
        return day

    return _make_day


@pytest_asyncio.fixture
async def make_section(db_session):
    """Фабрика секций программы (через ORM)."""
    async def _make_section(day_id: int, *, title_ru="Секция", order=0):
        section = CongressProgramSection(
            day_id=day_id,
            title_ru=title_ru,
            title_uz=title_ru,
            title_en=title_ru,
            order=order,
        )
        db_session.add(section)
        await db_session.commit()
        await db_session.refresh(section)
        return section

    return _make_section
