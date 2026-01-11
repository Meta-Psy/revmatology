"""
Миграция: обновление таблицы school_applications
Добавляет новые поля: event_id, city, category, inn, specialization, workplace
"""
import asyncio
from sqlalchemy import text
from database.connection import engine


async def run_migration():
    async with engine.begin() as conn:
        print("Updating school_applications table...")

        # Добавляем новые колонки (PostgreSQL синтаксис с IF NOT EXISTS)
        await conn.execute(text("""
            DO $$
            BEGIN
                -- event_id
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                              WHERE table_name='school_applications' AND column_name='event_id') THEN
                    ALTER TABLE school_applications ADD COLUMN event_id INTEGER;
                END IF;

                -- city
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                              WHERE table_name='school_applications' AND column_name='city') THEN
                    ALTER TABLE school_applications ADD COLUMN city VARCHAR(100);
                END IF;

                -- category
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                              WHERE table_name='school_applications' AND column_name='category') THEN
                    ALTER TABLE school_applications ADD COLUMN category VARCHAR(50);
                END IF;

                -- inn
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                              WHERE table_name='school_applications' AND column_name='inn') THEN
                    ALTER TABLE school_applications ADD COLUMN inn VARCHAR(50);
                END IF;

                -- specialization
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                              WHERE table_name='school_applications' AND column_name='specialization') THEN
                    ALTER TABLE school_applications ADD COLUMN specialization VARCHAR(255);
                END IF;

                -- workplace
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                              WHERE table_name='school_applications' AND column_name='workplace') THEN
                    ALTER TABLE school_applications ADD COLUMN workplace VARCHAR(500);
                END IF;

                -- Обновляем school_type по умолчанию
                ALTER TABLE school_applications ALTER COLUMN school_type SET DEFAULT 'rheumatologist';

            END $$;
        """))

        print("Migration completed successfully!")
        print("Added columns: event_id, city, category, inn, specialization, workplace")


if __name__ == "__main__":
    asyncio.run(run_migration())
