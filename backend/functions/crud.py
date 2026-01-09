from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional

from database import User, News, Congress, RheumatologyCenter, Doctor, Disease, SchoolApplication
from database.models import CongressRegistration, AssociationMember, Partner
from schemas import UserCreate, NewsCreate, NewsUpdate


# User CRUD
async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, user: UserCreate, hashed_password: str) -> User:
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


# News CRUD
async def get_news_list(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 10,
    published_only: bool = True
) -> List[News]:
    query = select(News).order_by(desc(News.created_at))
    if published_only:
        query = query.where(News.is_published == True)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def get_news_by_id(db: AsyncSession, news_id: int) -> Optional[News]:
    result = await db.execute(select(News).where(News.id == news_id))
    return result.scalar_one_or_none()


async def create_news(db: AsyncSession, news: NewsCreate, author_id: int) -> News:
    db_news = News(**news.model_dump(), author_id=author_id)
    db.add(db_news)
    await db.commit()
    await db.refresh(db_news)
    return db_news


async def update_news(db: AsyncSession, news_id: int, news: NewsUpdate) -> Optional[News]:
    db_news = await get_news_by_id(db, news_id)
    if not db_news:
        return None
    update_data = news.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_news, key, value)
    await db.commit()
    await db.refresh(db_news)
    return db_news


async def delete_news(db: AsyncSession, news_id: int) -> bool:
    db_news = await get_news_by_id(db, news_id)
    if not db_news:
        return False
    await db.delete(db_news)
    await db.commit()
    return True


# Congress CRUD
async def get_congresses(db: AsyncSession, active_only: bool = True) -> List[Congress]:
    query = select(Congress).order_by(desc(Congress.date_start))
    if active_only:
        query = query.where(Congress.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()


async def get_congress_by_id(db: AsyncSession, congress_id: int) -> Optional[Congress]:
    result = await db.execute(select(Congress).where(Congress.id == congress_id))
    return result.scalar_one_or_none()


async def create_congress_registration(
    db: AsyncSession,
    registration_data: dict,
    user_id: Optional[int] = None
) -> CongressRegistration:
    db_reg = CongressRegistration(**registration_data, user_id=user_id)
    db.add(db_reg)
    await db.commit()
    await db.refresh(db_reg)
    return db_reg


# Centers CRUD
async def get_centers(db: AsyncSession) -> List[RheumatologyCenter]:
    result = await db.execute(
        select(RheumatologyCenter).where(RheumatologyCenter.is_active == True)
    )
    return result.scalars().all()


# Doctors CRUD
async def get_doctors(db: AsyncSession, chief_only: bool = False) -> List[Doctor]:
    query = select(Doctor).order_by(Doctor.order)
    if chief_only:
        query = query.where(Doctor.is_chief == True)
    result = await db.execute(query)
    return result.scalars().all()


# Diseases CRUD
async def get_diseases(db: AsyncSession) -> List[Disease]:
    result = await db.execute(select(Disease))
    return result.scalars().all()


async def get_disease_by_id(db: AsyncSession, disease_id: int) -> Optional[Disease]:
    result = await db.execute(select(Disease).where(Disease.id == disease_id))
    return result.scalar_one_or_none()


# School Applications
async def create_school_application(db: AsyncSession, application_data: dict) -> SchoolApplication:
    db_app = SchoolApplication(**application_data)
    db.add(db_app)
    await db.commit()
    await db.refresh(db_app)
    return db_app


# Association Members
async def get_association_members(db: AsyncSession) -> List[AssociationMember]:
    result = await db.execute(
        select(AssociationMember)
        .where(AssociationMember.is_active == True)
        .order_by(AssociationMember.order)
    )
    return result.scalars().all()


# Partners (International Cooperation)
async def get_partners(db: AsyncSession) -> List[Partner]:
    result = await db.execute(
        select(Partner)
        .where(Partner.is_active == True)
        .order_by(Partner.order)
    )
    return result.scalars().all()
