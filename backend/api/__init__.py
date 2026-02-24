from fastapi import APIRouter
from .auth import router as auth_router
from .content import router as content_router
from .congress import router as congress_router
from .admin import router as admin_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(content_router, prefix="/content", tags=["Content"])
api_router.include_router(congress_router, prefix="/congress", tags=["Congress"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin"])
