from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.congress import CongressResponse, CongressRegistrationCreate, CongressRegistrationResponse
from functions.crud import get_congresses, get_congress_by_id, create_congress_registration

router = APIRouter()


@router.get("/", response_model=List[CongressResponse])
async def list_congresses(db: AsyncSession = Depends(get_db)):
    return await get_congresses(db, active_only=True)


@router.get("/{congress_id}", response_model=CongressResponse)
async def get_congress(congress_id: int, db: AsyncSession = Depends(get_db)):
    congress = await get_congress_by_id(db, congress_id)
    if not congress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Congress not found"
        )
    return congress


@router.post("/{congress_id}/register", response_model=CongressRegistrationResponse)
async def register_for_congress(
    congress_id: int,
    registration: CongressRegistrationCreate,
    db: AsyncSession = Depends(get_db)
):
    congress = await get_congress_by_id(db, congress_id)
    if not congress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Congress not found"
        )
    if not congress.registration_open:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is closed"
        )

    registration_data = registration.model_dump()
    return await create_congress_registration(db, registration_data)
