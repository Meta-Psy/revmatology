from fastapi import APIRouter
from .auth import router as auth_router
from .content import router as content_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(content_router, prefix="/content", tags=["Content"])
