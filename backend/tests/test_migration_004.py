"""Миграция 004: young_scientists_file_ru/uz/en в congresses.

Офлайн (`alembic upgrade 003:004 --sql`) — на диалекте PostgreSQL, как на проде.
Онлайн — на файле SQLite: свежая установка (create_all уже создал колонки,
upgrade не должен падать), downgrade и повторный upgrade (путь прода с
alembic_version = 003). На настоящем Postgres миграция проверяется руками
в одноразовом контейнере — см. отчёт узла К-08.

Config собирается без alembic.ini: fileConfig из ini отключил бы уже созданные
логгеры и сломал бы caplog в соседних тестах.
"""
import asyncio
import io
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import create_async_engine

import config as app_config
from database.connection import Base

BACKEND_DIR = Path(__file__).resolve().parent.parent

NEW_COLUMNS = {"young_scientists_file_ru", "young_scientists_file_uz", "young_scientists_file_en"}


def _alembic_config(buffer=None) -> Config:
    cfg = Config(output_buffer=buffer) if buffer is not None else Config()
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    return cfg


def test_offline_sql_adds_three_nullable_columns(monkeypatch):
    monkeypatch.setattr(app_config.settings, "DATABASE_URL", "postgresql+asyncpg://u:p@localhost/rheum")
    buffer = io.StringIO()

    command.upgrade(_alembic_config(buffer), "003:004", sql=True)

    sql = buffer.getvalue()
    for name in sorted(NEW_COLUMNS):
        assert f"ALTER TABLE congresses ADD COLUMN {name} VARCHAR(500)" in sql
    assert "NOT NULL" not in sql
    assert "UPDATE alembic_version SET version_num='004' WHERE alembic_version.version_num = '003'" in sql


def _congress_columns(url: str) -> set:
    async def _inspect():
        engine = create_async_engine(url)
        async with engine.connect() as conn:
            columns = await conn.run_sync(lambda sync: {c["name"] for c in inspect(sync).get_columns("congresses")})
        await engine.dispose()
        return columns

    return asyncio.run(_inspect())


def test_upgrade_is_idempotent_and_downgrade_reverts(monkeypatch, tmp_path):
    url = f"sqlite+aiosqlite:///{(tmp_path / 'migr.db').as_posix()}"
    monkeypatch.setattr(app_config.settings, "DATABASE_URL", url)
    cfg = _alembic_config()

    async def _create_all():
        engine = create_async_engine(url)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()

    # свежая установка: main.py создал таблицы уже с новыми колонками
    asyncio.run(_create_all())
    command.stamp(cfg, "003")
    command.upgrade(cfg, "004")
    assert NEW_COLUMNS <= _congress_columns(url)

    # откат снимает колонки — это и есть состояние прода до выкатки (003)
    command.downgrade(cfg, "003")
    columns = _congress_columns(url)
    assert not NEW_COLUMNS & columns
    assert "program_file_ru" in columns

    command.upgrade(cfg, "004")
    assert NEW_COLUMNS <= _congress_columns(url)


def test_004_follows_003():
    script = ScriptDirectory.from_config(_alembic_config()).get_revision("004")
    assert script.down_revision == "003"
