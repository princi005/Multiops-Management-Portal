import uuid

from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.api.tenant import get_current_organization
from app.db.session import get_db
from app.models.organization import Organization, OrganizationMember, OrganizationSettings
from app.models.user import User


def require_org_permission(permission_code: str):
    async def check(
        active: tuple[Organization, OrganizationMember] = Depends(get_current_organization),
        db: AsyncSession = Depends(get_db),
        _user: User = Depends(get_current_user),
    ) -> OrganizationMember:
        organization, membership = active
        if membership.role == "org_admin":
            return membership

        settings = await db.get(OrganizationSettings, organization.id)
        roles = (settings.config if settings else {}).get("roles", [])
        assigned = next(
            (role for role in roles
             if str(role.get("name", "")).strip().casefold() == membership.role.strip().casefold()
             and role.get("enabled", True)),
            None,
        )
        if assigned is None or permission_code not in assigned.get("permissions", []):
            raise HTTPException(status_code=403, detail="Required organization permission is not assigned.")
        return membership

    return check
