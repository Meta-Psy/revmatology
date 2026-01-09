from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db, User, News, Congress
from database.models import CongressRegistration, SchoolApplication, UserRole
from schemas import UserResponse
from functions.auth import get_current_admin_user

router = APIRouter()


# Dashboard Stats
@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    news_count = await db.scalar(select(func.count(News.id)))
    users_count = await db.scalar(select(func.count(User.id)))
    congress_regs = await db.scalar(select(func.count(CongressRegistration.id)))
    school_apps = await db.scalar(select(func.count(SchoolApplication.id)))

    return {
        "news": news_count or 0,
        "users": users_count or 0,
        "congressRegistrations": congress_regs or 0,
        "schoolApplications": school_apps or 0
    }


# Users Management
@router.get("/users", response_model=List[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    result = await db.execute(
        select(User).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role: UserRole,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change own role")

    user.role = role
    await db.commit()
    return {"message": "Role updated successfully"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    await db.delete(user)
    await db.commit()
    return {"message": "User deleted successfully"}


# Congress Registrations
@router.get("/congress/registrations")
async def list_congress_registrations(
    congress_id: int = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    query = select(CongressRegistration)
    if congress_id:
        query = query.where(CongressRegistration.congress_id == congress_id)
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    registrations = result.scalars().all()

    return [
        {
            "id": r.id,
            "congress_id": r.congress_id,
            "full_name": r.full_name,
            "email": r.email,
            "phone": r.phone,
            "organization": r.organization,
            "position": r.position,
            "created_at": r.created_at
        }
        for r in registrations
    ]


# School Applications
@router.get("/school/applications")
async def list_school_applications(
    school_type: str = None,
    status: str = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    query = select(SchoolApplication)
    if school_type:
        query = query.where(SchoolApplication.school_type == school_type)
    if status:
        query = query.where(SchoolApplication.status == status)
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    applications = result.scalars().all()

    return [
        {
            "id": a.id,
            "school_type": a.school_type,
            "full_name": a.full_name,
            "email": a.email,
            "phone": a.phone,
            "organization": a.organization,
            "specialty": a.specialty,
            "message": a.message,
            "status": a.status,
            "created_at": a.created_at
        }
        for a in applications
    ]


@router.put("/school/applications/{application_id}/status")
async def update_application_status(
    application_id: int,
    status: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    if status not in ["pending", "approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    result = await db.execute(
        select(SchoolApplication).where(SchoolApplication.id == application_id)
    )
    application = result.scalar_one_or_none()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    application.status = status
    await db.commit()
    return {"message": "Status updated successfully"}
