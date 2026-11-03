import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.skill import Skill
from app.schemas.skill import SkillCreate


async def list_skills(db: AsyncSession) -> list[Skill]:
    result = await db.execute(select(Skill).order_by(Skill.name))
    return list(result.scalars().all())


async def create_skill(db: AsyncSession, payload: SkillCreate) -> Skill:
    result = await db.execute(select(Skill).where(Skill.name == payload.name))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Skill already exists.")
    skill = Skill(id=uuid.uuid4(), name=payload.name)
    db.add(skill)
    await db.commit()
    await db.refresh(skill)
    return skill