"""
Скрипт для применения миграции: добавление полей achievements в chief_rheumatologists
"""
import asyncio
from sqlalchemy import text
from database.connection import engine


async def run_migration():
    async with engine.begin() as conn:
        # Добавляем колонки achievements
        await conn.execute(text("""
            ALTER TABLE chief_rheumatologists
            ADD COLUMN IF NOT EXISTS achievements_ru TEXT,
            ADD COLUMN IF NOT EXISTS achievements_uz TEXT,
            ADD COLUMN IF NOT EXISTS achievements_en TEXT;
        """))
        print("Migration completed: added achievements columns to chief_rheumatologists")


if __name__ == "__main__":
    asyncio.run(run_migration())
