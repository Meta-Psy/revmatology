from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from sqlalchemy import text

from database.connection import engine, Base
from database.models import *  # Импортируем все модели для создания таблиц
from api import api_router

# Создаём папку uploads если её нет
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Add new columns to existing tables (create_all won't alter existing tables)
        for col in ('content_ru', 'content_uz', 'content_en'):
            await conn.execute(text(
                f"ALTER TABLE diseases ADD COLUMN IF NOT EXISTS {col} TEXT"
            ))
        # Congress: add new columns to existing congresses table
        congress_text_cols = [
            'about_ru', 'about_uz', 'about_en',
            'organizers_ru', 'organizers_uz', 'organizers_en',
            'young_scientists_ru', 'young_scientists_uz', 'young_scientists_en',
            'info_letter_ru', 'info_letter_uz', 'info_letter_en',
        ]
        for col in congress_text_cols:
            await conn.execute(text(
                f"ALTER TABLE congresses ADD COLUMN IF NOT EXISTS {col} TEXT"
            ))
        congress_str_cols = [
            ('contact_publications_phone', 'VARCHAR(50)'),
            ('contact_publications_email', 'VARCHAR(255)'),
            ('contact_registration_phone', 'VARCHAR(50)'),
            ('contact_registration_email', 'VARCHAR(255)'),
            ('contact_participation_phone', 'VARCHAR(50)'),
            ('contact_participation_email', 'VARCHAR(255)'),
            ('info_letter_file_ru', 'VARCHAR(500)'),
            ('info_letter_file_uz', 'VARCHAR(500)'),
            ('info_letter_file_en', 'VARCHAR(500)'),
        ]
        for col, dtype in congress_str_cols:
            await conn.execute(text(
                f"ALTER TABLE congresses ADD COLUMN IF NOT EXISTS {col} {dtype}"
            ))
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="Rheumatology Association of Uzbekistan API",
    description="API for the Rheumatology Association of Uzbekistan website",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Статические файлы (uploads)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include API routes
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Rheumatology Association of Uzbekistan API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
