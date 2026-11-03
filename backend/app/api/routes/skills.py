from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.skill import SkillCreate, SkillRead
from app.services import skill_service

router = APIRouter(prefix="/skills", tags=["skills"])


@router.get("", response_model=list[SkillRead])
async def list_skills(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("HR", "Manager", "CEO")),
):
    return await skill_service.list_skills(db)


@router.post("", response_model=SkillRead, status_code=201)
async def create_skill(
    payload: SkillCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("HR")),
):
    return await skill_service.create_skill(db, payload)