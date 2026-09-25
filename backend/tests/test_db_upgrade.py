"""Подготовка БД разовым контейнером перед подменой backend (К-12).

Раньше порядок складывался сам: main.py на старте создавал недостающие
таблицы, alembic шёл следом. Теперь backend поднимается последним, и решение
принимает db_upgrade — а решений у него ровно три, по три состояния базы:
есть версия → только миграции; версии нет и таблиц нет → create_all и штамп;
версии нет, а таблицы есть → отказ, ничего не меняя. Здесь проверяются все
три, потому что цена ошибки в двух последних — молча испорченный прод.
"""
import asyncio
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import create_async_engine

import config as app_config
import db_upgrade
from database.connection import Base

BACKEND_DIR = Path(__file__).resolve().parent.parent
CERT_TABLES = {"certificate_templates", "certificate_recipients"}


def _alembic_config() -> Config:
    cfg = Config()
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    return cfg


@pytest.fixture
def db(monkeypatch, tmp_path):
    """Файловая БД: db_upgrade и alembic смотрят в одну и ту же."""
    url = f"sqlite+aiosqlite:///{(tmp_path / 'deploy.db').as_posix()}"
    monkeypatch.setattr(app_config.settings, "DATABASE_URL", url)
    monkeypatch.setattr(db_upgrade, "engine", create_async_engine(url))
    monkeypatch.chdir(BACKEND_DIR)  # alembic.ini ищется рядом, как в контейнере
    return url


def _tables(url: str) -> dict:
    async def _read():
        engine = create_async_engine(url)
        async with engine.connect() as conn:
            columns = await conn.run_sync(
                lambda sync: {name: {c["name"] for c in inspect(sync).get_columns(name)}
                              for name in inspect(sync).get_table_names()})
        await engine.dispose()
        return columns

    return asyncio.run(_read())


def _version(url: str) -> str:
    async def _read():
        engine = create_async_engine(url)
        async with engine.connect() as conn:
            version = (await conn.execute(text("SELECT version_num FROM alembic_version"))).scalar_one()
        await engine.dispose()
        return version

    return asyncio.run(_read())


def _head() -> str:
    from alembic.script import ScriptDirectory
    return ScriptDirectory.from_config(_alembic_config()).get_current_head()


def _create_all_but_certificates(url: str) -> None:
    """Обжитая база: всё, кроме таблиц сертификатов, — их создаёт миграция 005."""
    async def _create():
        engine = create_async_engine(url)
        tables = [t for name, t in Base.metadata.tables.items() if name not in CERT_TABLES]
        async with engine.begin() as conn:
            await conn.run_sync(lambda sync: Base.metadata.create_all(sync, tables=tables))
        await engine.dispose()

    asyncio.run(_create())


# ==================== пустая база ====================

def test_empty_database_gets_full_schema_and_head_version(db):
    """Пустая БД: схему строит create_all, миграции с 001 на ней не прошли бы."""
    db_upgrade.main()

    columns = _tables(db)
    assert CERT_TABLES <= set(columns)
    assert "issue_mode" in columns["certificate_templates"]
    assert "email" in columns["certificate_recipients"]
    assert _version(db) == _head()


def test_migrations_do_not_silence_application_loggers(db):
    """alembic.ini читается через fileConfig, а тот по умолчанию выключает все
    уже созданные логгеры — приложение после миграции осталось бы без логов
    навсегда, и первым это ловил чужой тест на предупреждение о битом файле."""
    import logging

    logger = logging.getLogger("api.content")

    db_upgrade.main()

    assert logger.disabled is False


# ==================== база под Alembic ====================

def test_existing_database_is_migrated_not_stamped(db):
    """Обжитая БД под Alembic: 006 должна примениться, а не быть проштампована."""
    _create_all_but_certificates(db)
    command.stamp(_alembic_config(), "004")
    command.upgrade(_alembic_config(), "005")

    db_upgrade.main()

    columns = _tables(db)
    assert "issue_mode" in columns["certificate_templates"]
    assert "is_open" in columns["certificate_templates"]  # 006 расширяет, не сужает
    assert _version(db) == _head()


def test_lagging_database_is_left_to_alembic_alone(db, monkeypatch):
    """База отстала на миграцию, которая CREATE'ит таблицу (005).

    Пройтись create_all по обжитой базе — значит создать таблицы сертификатов
    раньше времени; 005 это сегодня терпит (проверяет наличие), но полагаться
    на вежливость каждой будущей миграции нельзя. Обжитая база — только
    Alembic, поэтому смотрим не только на исход, но и на то, что страховка
    не звалась.
    """
    _create_all_but_certificates(db)
    command.stamp(_alembic_config(), "004")
    safety_net = []

    async def _spy():
        safety_net.append(True)

    monkeypatch.setattr(db_upgrade, "create_schema", _spy)

    db_upgrade.main()

    assert safety_net == []
    columns = _tables(db)
    assert CERT_TABLES <= set(columns)  # таблицы создала миграция 005
    assert "issue_mode" in columns["certificate_templates"]
    assert _version(db) == _head()


# ==================== таблицы есть, версии нет ====================

def test_tracked_nowhere_but_not_empty_refuses_and_changes_nothing(db):
    """Перенос базы, ручное восстановление, снесённая alembic_version.

    Штамп head здесь помечал бы как «актуальную» схему без issue_mode и email:
    прод отдавал бы 500, и повторная выкатка уже ничего не исправила бы.
    Отказ останавливает выкатку до подмены backend — это правильный исход.
    """
    _create_all_but_certificates(db)
    before = _tables(db)

    with pytest.raises(RuntimeError) as failure:
        db_upgrade.main()

    message = str(failure.value)
    assert "alembic_version" in message  # сказано, чего не хватает
    assert "alembic stamp" in message    # и что делать руками
    assert _tables(db) == before         # схема не тронута
    assert "alembic_version" not in before
