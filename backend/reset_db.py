"""Скрипт для пересоздания таблиц БД"""
import asyncio
from database.connection import engine, Base
from database.models import *  # Импортируем все модели


async def reset_database():
    async with engine.begin() as conn:
        print("Dropping all tables...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Done!")


if __name__ == "__main__":
    asyncio.run(reset_database())
