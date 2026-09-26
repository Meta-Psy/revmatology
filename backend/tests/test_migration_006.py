"""Миграция 006: email получателя и issue_mode рядом со старым is_open (К-12).

По образцу test_migration_005: офлайн — SQL на диалекте PostgreSQL, как на
проде; онлайн — на файле SQLite. Состояние «как на проде до выкатки» строится
не руками, а самой миграцией 005: create_all создаёт всё, кроме таблиц
сертификатов, а их создаёт 005 — со старой колонкой is_open и без email.

Отдельно стережётся выкатка в два шага: 006 только расширяет схему, is_open
остаётся в БД (иначе работающий старый контейнер упадёт на своих же запросах),
и убирает её следующая миграция. Отсюда разница со свежей установкой: она
ровно в одной колонке, и тест на это смотрит.
"""
import asyncio
import io
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import create_async_engine

import config as app_config
from database.connection import Base

BACKEND_DIR = Path(__file__).resolve().parent.parent
CERT_TABLES = {"certificate_templates", "certificate_recipients"}


def _alembic_config(buffer=None) -> Config:
    cfg = Config(output_buffer=buffer) if buffer is not None else Config()
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    return cfg


def test_offline_sql_moves_is_open_into_issue_mode(monkeypatch):
    monkeypatch.setattr(app_config.settings, "DATABASE_URL", "postgresql+asyncpg://u:p@localhost/rheum")
    buffer = io.StringIO()

    command.upgrade(_alembic_config(buffer), "005:006", sql=True)

    sql = buffer.getvalue()
    assert "ALTER TABLE certificate_recipients ADD COLUMN email VARCHAR(255)" in sql
    assert "CREATE INDEX ix_certificate_recipients_email ON certificate_recipients (email)" in sql
    assert "ALTER TABLE certificate_templates ADD COLUMN issue_mode VARCHAR(10) DEFAULT 'auto' NOT NULL" in sql
    assert "ck_certificate_templates_issue_mode" in sql and "issue_mode IN ('auto', 'open', 'closed')" in sql
    assert "UPDATE certificate_templates SET issue_mode = 'open' WHERE is_open" in sql
    # старый контейнер ещё жив в момент миграции: колонку не трогаем,
    # только даём ей умолчание — новый код вставляет строки без неё
    assert "DROP COLUMN is_open" not in sql
    assert "ALTER TABLE certificate_templates ALTER COLUMN is_open SET DEFAULT false" in sql
    assert "UPDATE alembic_version SET version_num='006' WHERE alembic_version.version_num = '005'" in sql


def _run(coro):
    return asyncio.run(coro)


def _columns(url: str) -> dict:
    async def _inspect():
        engine = create_async_engine(url)
        async with engine.connect() as conn:
            def _collect(sync):
                insp = inspect(sync)
                return {name: {c["name"] for c in insp.get_columns(name)} for name in insp.get_table_names()}
            columns = await conn.run_sync(_collect)
        await engine.dispose()
        return columns

    return _run(_inspect())


def _sql(url: str, statements: list[str]) -> list:
    async def _exec():
        engine = create_async_engine(url)
        rows = []
        async with engine.begin() as conn:
            for statement in statements:
                result = await conn.execute(text(statement))
                rows.append(result.all() if result.returns_rows else [])
        await engine.dispose()
        return rows

    return _run(_exec())


def _create_all_but_certificates(url: str) -> None:
    async def _create():
        engine = create_async_engine(url)
        tables = [t for name, t in Base.metadata.tables.items() if name not in CERT_TABLES]
        async with engine.begin() as conn:
            await conn.run_sync(lambda sync: Base.metadata.create_all(sync, tables=tables))
        await engine.dispose()

    _run(_create())


def test_upgrade_moves_data_and_downgrade_returns_it(monkeypatch, tmp_path):
    url = f"sqlite+aiosqlite:///{(tmp_path / 'migr006.db').as_posix()}"
    monkeypatch.setattr(app_config.settings, "DATABASE_URL", url)
    cfg = _alembic_config()

    # состояние прода до выкатки: таблицы сертификатов создала миграция 005
    _create_all_but_certificates(url)
    command.stamp(cfg, "004")
    command.upgrade(cfg, "005")
    assert "is_open" in _columns(url)["certificate_templates"]
    _sql(url, [
        "INSERT INTO congresses (id, title_ru, title_uz, title_en) VALUES (1, 'A', 'A', 'A'), (2, 'B', 'B', 'B')",
        "INSERT INTO certificate_templates (id, congress_id, box_x_mm, box_y_mm, box_w_mm, box_h_mm,"
        " font_max_pt, font_min_pt, text_color, is_open, number_font_pt, next_number)"
        " VALUES (1, 1, 1, 1, 1, 1, 40, 16, '#1B3A7A', 1, 14, 1), (2, 2, 1, 1, 1, 1, 40, 16, '#1B3A7A', 0, 14, 1)",
        "INSERT INTO certificate_recipients (id, congress_id, full_name, name_key, download_count, number)"
        " VALUES (1, 1, 'Алиев Али', 'алиев али', 0, 1)",
    ])

    command.upgrade(cfg, "006")

    columns = _columns(url)
    assert "email" in columns["certificate_recipients"]
    assert "issue_mode" in columns["certificate_templates"]
    assert "is_open" in columns["certificate_templates"]  # убирает 007, не 006
    modes = _sql(url, ["SELECT id, issue_mode FROM certificate_templates ORDER BY id"])[0]
    assert modes == [(1, "open"), (2, "auto")]  # была открыта — осталась открытой

    # новый код о is_open не знает: вставка без неё должна проходить
    _sql(url, [
        "INSERT INTO congresses (id, title_ru, title_uz, title_en) VALUES (3, 'C', 'C', 'C')",
        "INSERT INTO certificate_templates (id, congress_id, box_x_mm, box_y_mm, box_w_mm, box_h_mm,"
        " font_max_pt, font_min_pt, text_color, issue_mode, number_font_pt, next_number)"
        " VALUES (3, 3, 1, 1, 1, 1, 40, 16, '#1B3A7A', 'auto', 14, 1)",
    ])

    command.downgrade(cfg, "005")
    columns = _columns(url)
    assert "issue_mode" not in columns["certificate_templates"]
    assert "email" not in columns["certificate_recipients"]
    flags = _sql(url, ["SELECT id, is_open FROM certificate_templates ORDER BY id"])[0]
    assert [(rid, bool(flag)) for rid, flag in flags] == [(1, True), (2, False), (3, False)]


def _create_all(url: str) -> None:
    async def _create():
        engine = create_async_engine(url)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()

    _run(_create())


def test_fresh_install_upgrade_does_not_fail(monkeypatch, tmp_path):
    """Свежая установка: main.py создал таблицы через create_all уже в новом виде."""
    url = f"sqlite+aiosqlite:///{(tmp_path / 'fresh006.db').as_posix()}"
    monkeypatch.setattr(app_config.settings, "DATABASE_URL", url)
    cfg = _alembic_config()

    _create_all(url)
    command.stamp(cfg, "005")
    command.upgrade(cfg, "006")

    columns = _columns(url)
    assert "issue_mode" in columns["certificate_templates"]
    assert "email" in columns["certificate_recipients"]
    # create_all работает по модели, а в модели is_open уже нет
    assert "is_open" not in columns["certificate_templates"]


def test_migrated_schema_differs_from_create_all_only_by_is_open(monkeypatch, tmp_path):
    """На ревизии 006 схемы сходятся с точностью до одной колонки — is_open.

    Сторож расхождения, заведённого нарочно: is_open живёт лишь между двумя
    выкатками. Что после 007 схемы сходятся полностью, проверяет
    test_migration_007.test_migrated_schema_matches_create_all — здесь ревизия
    зафиксирована на 006, иначе тест проверял бы уже не эту миграцию.
    """
    migrated_url = f"sqlite+aiosqlite:///{(tmp_path / 'migrated.db').as_posix()}"
    fresh_url = f"sqlite+aiosqlite:///{(tmp_path / 'fresh.db').as_posix()}"

    monkeypatch.setattr(app_config.settings, "DATABASE_URL", migrated_url)
    _create_all_but_certificates(migrated_url)
    command.stamp(_alembic_config(), "004")
    command.upgrade(_alembic_config(), "006")
    migrated = _columns(migrated_url)

    monkeypatch.setattr(app_config.settings, "DATABASE_URL", fresh_url)
    _create_all(fresh_url)
    fresh = _columns(fresh_url)

    assert migrated["certificate_recipients"] == fresh["certificate_recipients"]
    assert migrated["certificate_templates"] == fresh["certificate_templates"] | {"is_open"}


def test_downgrade_works_on_create_all_schema(monkeypatch, tmp_path):
    """Откат на свежей установке: там CHECK из модели и нет колонки is_open.

    SQLite отказывается удалять колонку, на которую ссылается CHECK, — путь
    разработки, но падать он не должен.
    """
    url = f"sqlite+aiosqlite:///{(tmp_path / 'fresh_down.db').as_posix()}"
    monkeypatch.setattr(app_config.settings, "DATABASE_URL", url)
    cfg = _alembic_config()

    _create_all(url)
    command.stamp(cfg, "005")
    command.upgrade(cfg, "006")
    _sql(url, [
        "INSERT INTO congresses (id, title_ru, title_uz, title_en) VALUES (1, 'A', 'A', 'A')",
        "INSERT INTO certificate_templates (id, congress_id, box_x_mm, box_y_mm, box_w_mm, box_h_mm,"
        " font_max_pt, font_min_pt, text_color, issue_mode, number_font_pt, next_number)"
        " VALUES (1, 1, 1, 1, 1, 1, 40, 16, '#1B3A7A', 'open', 14, 1)",
    ])

    command.downgrade(cfg, "005")

    columns = _columns(url)
    assert "issue_mode" not in columns["certificate_templates"]
    assert "is_open" in columns["certificate_templates"]
    assert "email" not in columns["certificate_recipients"]
    assert [(rid, bool(flag)) for rid, flag in
            _sql(url, ["SELECT id, is_open FROM certificate_templates"])[0]] == [(1, True)]


def test_006_follows_005():
    script = ScriptDirectory.from_config(_alembic_config()).get_revision("006")
    assert script.down_revision == "005"
