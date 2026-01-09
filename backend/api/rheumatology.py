from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.rheumatology import (
    CenterResponse, DoctorResponse, DiseaseResponse,
    SchoolApplicationCreate, SchoolApplicationResponse
)
from functions.crud import (
    get_centers, get_doctors, get_diseases, get_disease_by_id,
    create_school_application, get_association_members, get_partners
)

router = APIRouter()


# Centers
@router.get("/centers", response_model=List[CenterResponse])
async def list_centers(db: AsyncSession = Depends(get_db)):
    return await get_centers(db)


# Doctors
@router.get("/doctors", response_model=List[DoctorResponse])
async def list_doctors(
    chief_only: bool = False,
    db: AsyncSession = Depends(get_db)
):
    return await get_doctors(db, chief_only=chief_only)


# Diseases
@router.get("/diseases", response_model=List[DiseaseResponse])
async def list_diseases(db: AsyncSession = Depends(get_db)):
    return await get_diseases(db)


@router.get("/diseases/{disease_id}", response_model=DiseaseResponse)
async def get_disease(disease_id: int, db: AsyncSession = Depends(get_db)):
    disease = await get_disease_by_id(db, disease_id)
    if not disease:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Disease not found"
        )
    return disease


# School Applications
@router.post("/school/apply", response_model=SchoolApplicationResponse)
async def apply_to_school(
    application: SchoolApplicationCreate,
    db: AsyncSession = Depends(get_db)
):
    if application.school_type not in ["rheumatologist", "patient"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid school type. Must be 'rheumatologist' or 'patient'"
        )
    return await create_school_application(db, application.model_dump())


# Association Members
@router.get("/members")
async def list_members(db: AsyncSession = Depends(get_db)):
    return await get_association_members(db)


# Partners (International Cooperation)
@router.get("/partners")
async def list_partners(db: AsyncSession = Depends(get_db)):
    return await get_partners(db)
