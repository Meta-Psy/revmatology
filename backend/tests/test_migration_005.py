"""Миграция 005: таблицы certificate_templates и certificate_recipients (К-11).

По образцу test_migration_004: офлайн — SQL на диалекте PostgreSQL, как на
проде; онлайн — на файле SQLite: свежая установка (create_all уже создал
таблицы, upgrade не должен падать), downgrade и повторный upgrade.
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
TABLES = {"certificate_templates", "certificate_recipients"}


def _alembic_config(buffer=None) -> Config:
    cfg = Config(output_buffer=buffer) if buffer is not None else Config()
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    return cfg


def test_offline_sql_creates_tables(monkeypatch):
    monkeypatch.setattr(app_config.settings, "DATABASE_URL", "postgresql+asyncpg://u:p@localhost/rheum")
    buffer = io.StringIO()

    command.upgrade(_alembic_config(buffer), "004:005", sql=True)

    sql = buffer.getvalue()
    assert "CREATE TABLE certificate_templates" in sql
    assert "CREATE TABLE certificate_recipients" in sql
    assert "pdf BYTEA" in sql
    assert "ON DELETE CASCADE" in sql
    assert "UNIQUE (congress_id)" in sql
    assert "CREATE INDEX ix_certificate_recipients_name_key" in sql
    # порядковый номер: обязателен и уникален в пределах конгресса
    assert "number INTEGER NOT NULL" in sql
    assert "CONSTRAINT uq_certificate_recipients_congress_number UNIQUE (congress_id, number)" in sql
    for column in ("number_box_x_mm", "number_box_y_mm", "number_box_w_mm", "number_box_h_mm"):
        assert f"{column} FLOAT," in sql and f"{column} FLOAT NOT NULL" not in sql
    assert "number_font_pt FLOAT NOT NULL" in sql
    # счётчик номеров: удаление получателя номер не освобождает
    assert "next_number INTEGER DEFAULT '1' NOT NULL" in sql
    assert "UPDATE alembic_version SET version_num='005' WHERE alembic_version.version_num = '004'" in sql


def _tables(url: str) -> dict:
    async def _inspect():
        engine = create_async_engine(url)
        async with engine.connect() as conn:
            def _collect(sync):
                insp = inspect(sync)
                return {
                    name: {c["name"] for c in insp.get_columns(name)}
                    for name in insp.get_table_names()
                }
            tables = await conn.run_sync(_collect)
        await engine.dispose()
        return tables

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

    # свежая установка: main.py создал таблицы через create_all
    asyncio.run(_create_all())
    command.stamp(cfg, "004")
    command.upgrade(cfg, "005")
    assert TABLES <= set(_tables(url))

    # откат — состояние прода до выкатки (004)
    command.downgrade(cfg, "004")
    tables = _tables(url)
    assert not TABLES & set(tables)
    assert "congresses" in tables

    command.upgrade(cfg, "005")
    tables = _tables(url)
    assert {"pdf", "box_x_mm", "font_max_pt", "text_color", "is_open", "updated_at",
            "number_box_x_mm", "number_box_y_mm", "number_box_w_mm", "number_box_h_mm",
            "number_font_pt"} <= tables["certificate_templates"]
    assert {"full_name", "name_key", "phone_digits", "download_count", "created_at", "number"} <= tables["certificate_recipients"]


def test_005_follows_004():
    script = ScriptDirectory.from_config(_alembic_config()).get_revision("005")
    assert script.down_revision == "004"
