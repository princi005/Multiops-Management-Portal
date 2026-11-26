import uuid

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.organization import Organization, OrganizationMember
from app.models.user import User


async def get_current_organization(
    x_organization_id: uuid.UUID | None = Header(default=None, alias="X-Organization-Id"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> tuple[Organization, OrganizationMember]:
    query = (
        select(Organization, OrganizationMember)
        .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
        .where(
            OrganizationMember.user_id == user.id,
            OrganizationMember.is_active.is_(True),
            Organization.is_active.is_(True),
        )
    )
    if x_organization_id:
        query = query.where(Organization.id == x_organization_id)

    result = await db.execute(query.order_by(Organization.name))
    matches = result.all()

    if not matches:
        raise HTTPException(status_code=403, detail="No active organization membership matches this request.")
    if x_organization_id is None and len(matches) > 1:
        raise HTTPException(status_code=409, detail="Select an organization before continuing.")

    return matches[0]
