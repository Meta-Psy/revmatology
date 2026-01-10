"""
Migration script to add new columns to database tables
"""
import asyncio
from sqlalchemy import text
from database.connection import engine

async def run_migration():
    print("Running migrations...")

    async with engine.begin() as conn:
        # === DISEASES TABLE ===
        print("\n--- Diseases table ---")

        # Add recommendation_file_url column
        try:
            await conn.execute(text("""
                ALTER TABLE diseases
                ADD COLUMN IF NOT EXISTS recommendation_file_url VARCHAR(500)
            """))
            print("Added column: recommendation_file_url")
        except Exception as e:
            print(f"Column recommendation_file_url: {e}")

        # Add protocol_file_url column
        try:
            await conn.execute(text("""
                ALTER TABLE diseases
                ADD COLUMN IF NOT EXISTS protocol_file_url VARCHAR(500)
            """))
            print("Added column: protocol_file_url")
        except Exception as e:
            print(f"Column protocol_file_url: {e}")

        # === BOARD_MEMBERS TABLE ===
        print("\n--- Board members table ---")

        # Add achievements columns
        try:
            await conn.execute(text("""
                ALTER TABLE board_members
                ADD COLUMN IF NOT EXISTS achievements_ru TEXT
            """))
            print("Added column: achievements_ru")
        except Exception as e:
            print(f"Column achievements_ru: {e}")

        try:
            await conn.execute(text("""
                ALTER TABLE board_members
                ADD COLUMN IF NOT EXISTS achievements_uz TEXT
            """))
            print("Added column: achievements_uz")
        except Exception as e:
            print(f"Column achievements_uz: {e}")

        try:
            await conn.execute(text("""
                ALTER TABLE board_members
                ADD COLUMN IF NOT EXISTS achievements_en TEXT
            """))
            print("Added column: achievements_en")
        except Exception as e:
            print(f"Column achievements_en: {e}")

    print("\nAll migrations completed successfully!")

if __name__ == "__main__":
    asyncio.run(run_migration())
