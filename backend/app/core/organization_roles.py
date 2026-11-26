from fastapi import Depends, HTTPException

from app.api.tenant import get_current_organization


def require_org_role(*allowed_roles: str):
    allowed = {role.casefold() for role in allowed_roles}

    async def dependency(active=Depends(get_current_organization)):
        organization, membership = active
        if membership.role.casefold() not in allowed:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to perform this action in this organization.",
            )
        return organization, membership

    return dependency