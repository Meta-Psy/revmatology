from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db, User
from schemas import NewsCreate, NewsUpdate, NewsResponse
from functions.auth import get_current_admin_user
from functions.crud import get_news_list, get_news_by_id, create_news, update_news, delete_news

router = APIRouter()


@router.get("/", response_model=List[NewsResponse])
async def list_news(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    return await get_news_list(db, skip=skip, limit=limit, published_only=True)


@router.get("/all", response_model=List[NewsResponse])
async def list_all_news(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    return await get_news_list(db, skip=skip, limit=limit, published_only=False)


@router.get("/{news_id}", response_model=NewsResponse)
async def get_news(news_id: int, db: AsyncSession = Depends(get_db)):
    news = await get_news_by_id(db, news_id)
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="News not found"
        )
    return news


@router.post("/", response_model=NewsResponse)
async def create_news_item(
    news: NewsCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    return await create_news(db, news, author_id=current_user.id)


@router.put("/{news_id}", response_model=NewsResponse)
async def update_news_item(
    news_id: int,
    news: NewsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    updated = await update_news(db, news_id, news)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="News not found"
        )
    return updated


@router.delete("/{news_id}")
async def delete_news_item(
    news_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    if not await delete_news(db, news_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="News not found"
        )
    return {"message": "News deleted successfully"}
