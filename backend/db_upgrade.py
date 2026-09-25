"""Приведение схемы БД под новый код перед подменой работающего backend (К-12).

Запускается разовым контейнером нового образа из .github/workflows/deploy.yml.
Раньше два шага складывались сами: main.py на старте создавал недостающие
таблицы, а alembic шёл следом; теперь backend поднимается последним, и решать
приходится здесь. Состояний базы три, и у каждого ровно один путь:

* есть `alembic_version` — только миграции. create_all по обжитой базе создал
  бы таблицу раньше той миграции, которая её CREATE'ит, и та упала бы на «уже
  существует»;
* нет `alembic_version` и нет таблиц приложения — пустая база: схему строит
  create_all (миграции с 001 на ней и не пройдут — они добавляют то, что
  create_all создаёт сразу), версия проставляется штампом;
* нет `alembic_version`, а таблицы есть — отказ, ничего не меняя. Так выглядит
  перенос базы, ручное восстановление или снесённая табличка версий. Штамп head
  пометил бы схему без новых колонок как актуальную: прод стабильно отдавал бы
  500, и повторная выкатка уже ничего не исправила бы. Выкатка останавливается
  до подмены backend — это лучший из доступных исходов.
"""
import asyncio

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from database.connection import Base, engine
from database.models import *  # noqa: F401,F403 — наполняем metadata

ALEMBIC_INI = "alembic.ini"
VERSION_TABLE = "alembic_version"


async def read_state() -> tuple[bool, set]:
    """(база под управлением Alembic, какие таблицы приложения в ней есть)."""
    async with engine.connect() as conn:
        tables = await conn.run_sync(lambda sync: set(inspect(sync).get_table_names()))
    await engine.dispose()
    return VERSION_TABLE in tables, tables & set(Base.metadata.tables)


async def create_schema() -> None:
    """Строит схему по моделям. Только для пустой базы — см. докстроку модуля."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()


def main() -> None:
    tracked, app_tables = asyncio.run(read_state())
    config = Config(ALEMBIC_INI)

    if tracked:
        command.upgrade(config, "head")
        return

    if app_tables:
        raise RuntimeError(
            f"В базе есть таблицы приложения ({', '.join(sorted(app_tables)[:5])}, ...), "
            f"но нет таблицы {VERSION_TABLE}: неизвестно, какие миграции уже применены. "
            "Ни миграции, ни create_all здесь применять нельзя — схема осталась нетронутой. "
            "Приведите её руками до нужной ревизии и отметьте версию "
            "(`alembic stamp <ревизия>`), затем повторите выкатку."
        )

    asyncio.run(create_schema())
    command.stamp(config, "head")


if __name__ == "__main__":
    main()
