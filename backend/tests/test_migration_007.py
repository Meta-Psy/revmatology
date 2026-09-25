"""Миграция 007: снятие is_open, нижний регистр почт, индекс по lower(email) (К-13).

Шаг «сузить» из выкатки в два шага (§8 design-doc К-12): 006 добавила
issue_mode и оставила is_open ради работающего старого контейнера, 007 её
убирает — новый код о колонке не знает с К-12.

Состояние «как на проде» строится не руками, а самими миграциями: create_all
создаёт всё, кроме таблиц сертификатов, их создаёт 005, is_open переносит в
issue_mode 006. Индекс по lower(email) с такой базы снимается отдельно: он
есть в модели, а значит и в create_all, — а на проде таблица users старше
этого индекса.

Почты приводятся к нижнему регистру только там, где это безопасно: users.email
уникален, и на проде есть пары «одна почта в разном регистре» (решение Alex
2026-09-25 — пары не трогать).
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
LOWER_INDEX = "ix_users_email_lower"

# Почты как на проде: регистр без пары, пара «верхний + нижний» и пара, в
# которой ни одна запись не в нижнем регистре, — слепой lower() упал бы на
# уникальности email на обеих парах.
USERS = [
    (1, "Alex@Mail.uz"),
    (2, "Pair@Mail.uz"),
    (3, "pair@mail.uz"),
    (4, "plain@mail.uz"),
    (5, "Both@Mail.uz"),
    (6, "both@Mail.UZ"),
]


def _alembic_config(buffer=None) -> Config:
    cfg = Config(output_buffer=buffer) if buffer is not None else Config()
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    return cfg


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


def _index_names(url: str) -> set:
    """Имена индексов из sqlite_master.

    Инспектор SQLAlchemy индексы по выражению на SQLite пропускает (reflection
    их не поддерживает), поэтому смотрим схему напрямую.
    """
    return {name for (name,) in _sql(url, ["SELECT name FROM sqlite_master WHERE type = 'index'"])[0]}


def _create_all(url: str) -> None:
    async def _create():
        engine = create_async_engine(url)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()

    _run(_create())


def _create_all_but_certificates(url: str) -> None:
    async def _create():
        engine = create_async_engine(url)
        tables = [t for name, t in Base.metadata.tables.items() if name not in CERT_TABLES]
        async with engine.begin() as conn:
            await conn.run_sync(lambda sync: Base.metadata.create_all(sync, tables=tables))
        await engine.dispose()

    _run(_create())


def _prod_like(url: str, monkeypatch) -> Config:
    """База как на проде перед выкаткой 007: миграции пройдены до 006."""
    monkeypatch.setattr(app_config.settings, "DATABASE_URL", url)
    cfg = _alembic_config()

    _create_all_but_certificates(url)
    command.stamp(cfg, "004")
    command.upgrade(cfg, "006")
    # индекса по lower(email) на проде нет: create_all создал его по модели,
    # но живая таблица users старше самого индекса
    _sql(url, [f"DROP INDEX IF EXISTS {LOWER_INDEX}"])
    return cfg


def _insert_templates(url: str) -> None:
    _sql(url, [
        "INSERT INTO congresses (id, title_ru, title_uz, title_en) VALUES (1, 'A', 'A', 'A'), (2, 'B', 'B', 'B')",
        "INSERT INTO certificate_templates (id, congress_id, box_x_mm, box_y_mm, box_w_mm, box_h_mm,"
        " font_max_pt, font_min_pt, text_color, is_open, issue_mode, number_font_pt, next_number)"
        " VALUES (1, 1, 1, 1, 1, 1, 40, 16, '#1B3A7A', 1, 'open', 14, 7),"
        " (2, 2, 1, 1, 1, 1, 40, 16, '#1B3A7A', 0, 'auto', 14, 1)",
        "INSERT INTO certificate_recipients (id, congress_id, full_name, name_key, phone_digits,"
        " download_count, number, email)"
        " VALUES (1, 1, 'Алиев Али', 'алиев али', '998901234567', 3, 1, 'ali@mail.uz')",
    ])


def _insert_users(url: str) -> None:
    values = ", ".join(
        f"({uid}, '{email}', 'hash', 'Фамилия', 'Имя')" for uid, email in USERS
    )
    _sql(url, [f"INSERT INTO users (id, email, hashed_password, last_name, first_name) VALUES {values}"])


def _emails(url: str) -> list:
    return _sql(url, ["SELECT id, email FROM users ORDER BY id"])[0]


def test_offline_sql_drops_is_open_and_indexes_lower_email(monkeypatch):
    monkeypatch.setattr(app_config.settings, "DATABASE_URL", "postgresql+asyncpg://u:p@localhost/rheum")
    buffer = io.StringIO()

    command.upgrade(_alembic_config(buffer), "006:007", sql=True)

    sql = buffer.getvalue()
    assert "ALTER TABLE certificate_templates DROP COLUMN is_open" in sql
    assert f"CREATE INDEX IF NOT EXISTS {LOWER_INDEX} ON users (lower(email))" in sql
    assert "UPDATE users SET email = lower(email)" in sql
    # issue_mode и его CHECK — не наше дело
    assert "DROP COLUMN issue_mode" not in sql
    assert "ck_certificate_templates_issue_mode" not in sql
    assert "UPDATE alembic_version SET version_num='007' WHERE alembic_version.version_num = '006'" in sql


def test_upgrade_drops_is_open_and_keeps_certificate_data(monkeypatch, tmp_path):
    url = f"sqlite+aiosqlite:///{(tmp_path / 'migr007.db').as_posix()}"
    cfg = _prod_like(url, monkeypatch)
    _insert_templates(url)

    command.upgrade(cfg, "007")

    columns = _columns(url)
    assert "is_open" not in columns["certificate_templates"]
    assert "issue_mode" in columns["certificate_templates"]
    assert _sql(url, ["SELECT id, issue_mode, next_number FROM certificate_templates ORDER BY id"])[0] == [
        (1, "open", 7), (2, "auto", 1)]
    assert _sql(url, ["SELECT id, full_name, phone_digits, download_count, number, email"
                      " FROM certificate_recipients"])[0] == [
        (1, "Алиев Али", "998901234567", 3, 1, "ali@mail.uz")]

    # новый код вставляет строки без is_open — и после снятия колонки тоже
    _sql(url, [
        "INSERT INTO congresses (id, title_ru, title_uz, title_en) VALUES (3, 'C', 'C', 'C')",
        "INSERT INTO certificate_templates (id, congress_id, box_x_mm, box_y_mm, box_w_mm, box_h_mm,"
        " font_max_pt, font_min_pt, text_color, issue_mode, number_font_pt, next_number)"
        " VALUES (3, 3, 1, 1, 1, 1, 40, 16, '#1B3A7A', 'closed', 14, 1)",
    ])


def test_downgrade_returns_is_open_with_values(monkeypatch, tmp_path):
    url = f"sqlite+aiosqlite:///{(tmp_path / 'down007.db').as_posix()}"
    cfg = _prod_like(url, monkeypatch)
    _insert_templates(url)
    command.upgrade(cfg, "007")

    command.downgrade(cfg, "006")

    columns = _columns(url)
    assert "is_open" in columns["certificate_templates"]
    assert "issue_mode" in columns["certificate_templates"]
    assert [(rid, bool(flag), mode) for rid, flag, mode in
            _sql(url, ["SELECT id, is_open, issue_mode FROM certificate_templates ORDER BY id"])[0]] == [
        (1, True, "open"), (2, False, "auto")]


def test_upgrade_lowercases_only_conflict_free_emails(monkeypatch, tmp_path):
    url = f"sqlite+aiosqlite:///{(tmp_path / 'emails007.db').as_posix()}"
    cfg = _prod_like(url, monkeypatch)
    _insert_users(url)

    command.upgrade(cfg, "007")

    assert _emails(url) == [
        (1, "alex@mail.uz"),   # регистр без пары — приведён
        (2, "Pair@Mail.uz"),   # пара остаётся как есть
        (3, "pair@mail.uz"),
        (4, "plain@mail.uz"),
        (5, "Both@Mail.uz"),   # пара из двух записей не в нижнем регистре
        (6, "both@Mail.UZ"),
    ]


def test_downgrade_leaves_emails_alone(monkeypatch, tmp_path):
    """Регистр почты не восстановим: откат чинит схему, а не данные."""
    url = f"sqlite+aiosqlite:///{(tmp_path / 'emails_down.db').as_posix()}"
    cfg = _prod_like(url, monkeypatch)
    _insert_users(url)
    command.upgrade(cfg, "007")

    command.downgrade(cfg, "006")

    assert _emails(url)[0] == (1, "alex@mail.uz")


def test_lower_email_index_appears_and_downgrade_removes_it(monkeypatch, tmp_path):
    url = f"sqlite+aiosqlite:///{(tmp_path / 'index007.db').as_posix()}"
    cfg = _prod_like(url, monkeypatch)
    assert LOWER_INDEX not in _index_names(url)

    command.upgrade(cfg, "007")
    assert LOWER_INDEX in _index_names(url)

    command.downgrade(cfg, "006")
    assert LOWER_INDEX not in _index_names(url)


def test_fresh_install_upgrade_does_not_fail(monkeypatch, tmp_path):
    """Свежая установка: схему построил create_all по модели, версия проставлена штампом.

    Колонки is_open там никогда не было, индекс по lower(email) уже есть —
    повторное снятие и повторное создание упали бы.
    """
    url = f"sqlite+aiosqlite:///{(tmp_path / 'fresh007.db').as_posix()}"
    monkeypatch.setattr(app_config.settings, "DATABASE_URL", url)
    cfg = _alembic_config()

    _create_all(url)
    assert LOWER_INDEX in _index_names(url)  # индекс есть в модели, значит и в create_all
    command.stamp(cfg, "006")

    command.upgrade(cfg, "007")

    assert "is_open" not in _columns(url)["certificate_templates"]
    assert LOWER_INDEX in _index_names(url)


def test_migrated_schema_matches_create_all(monkeypatch, tmp_path):
    """После 007 схемы миграций и create_all сходятся полностью.

    До 007 они расходились ровно на is_open — на этом стоял временный сторож
    в test_migration_006. Разойтись теперь нечему, поэтому сравниваются все
    таблицы, кроме служебной alembic_version.
    """
    migrated_url = f"sqlite+aiosqlite:///{(tmp_path / 'migrated007.db').as_posix()}"
    fresh_url = f"sqlite+aiosqlite:///{(tmp_path / 'fresh_cmp.db').as_posix()}"

    _prod_like(migrated_url, monkeypatch)
    command.upgrade(_alembic_config(), "007")
    migrated = {name: cols for name, cols in _columns(migrated_url).items() if name != "alembic_version"}

    monkeypatch.setattr(app_config.settings, "DATABASE_URL", fresh_url)
    _create_all(fresh_url)

    assert migrated == _columns(fresh_url)


def test_007_follows_006():
    script = ScriptDirectory.from_config(_alembic_config()).get_revision("007")
    assert script.down_revision == "006"
