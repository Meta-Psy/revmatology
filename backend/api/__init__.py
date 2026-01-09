from fastapi import APIRouter
from .auth import router as auth_router
from .news import router as news_router
from .congress import router as congress_router
from .rheumatology import router as rheumatology_router
from .admin import router as admin_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(news_router, prefix="/news", tags=["News"])
api_router.include_router(congress_router, prefix="/congress", tags=["Congress"])
api_router.include_router(rheumatology_router, prefix="/rheumatology", tags=["Rheumatology"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin"])
