from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.organization import OrganizationMember, PlatformAdmin
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
async def read_current_user(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    memberships = await db.execute(
        select(OrganizationMember.role).where(
            OrganizationMember.user_id == user.id,
            OrganizationMember.is_active.is_(True),
        )
    )
    platform_admin = await db.get(PlatformAdmin, user.id)
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "roles": [user_role.role.name for user_role in user.user_roles],
        "organization_roles": list(memberships.scalars().all()),
        "is_platform_admin": bool(platform_admin and platform_admin.is_active),
    }
