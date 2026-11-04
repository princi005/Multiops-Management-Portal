from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.me import MyProfile, MySalary
from app.services import me_service

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/profile", response_model=MyProfile)
async def my_profile(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await me_service.get_my_profile(db, user)


@router.get("/salary", response_model=MySalary)
async def my_salary(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await me_service.get_my_salary(db, user)