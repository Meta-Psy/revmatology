from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.rheumatology import SchoolApplicationCreate, SchoolApplicationResponse
from functions.crud import create_school_application

router = APIRouter()


# School Applications
@router.post("/school/apply", response_model=SchoolApplicationResponse)
async def apply_to_school(
    application: SchoolApplicationCreate,
    db: AsyncSession = Depends(get_db)
):
    """Регистрация на школу ревматологов"""
    if application.school_type not in ["rheumatologist", "patient"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid school type. Must be 'rheumatologist' or 'patient'"
        )
    if application.category not in ["highest", "first", "second", "third", "none"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category. Must be one of: highest, first, second, third, none"
        )
    return await create_school_application(db, application.model_dump())
