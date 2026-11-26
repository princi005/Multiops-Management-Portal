from fastapi import Depends

from app.api.tenant import get_current_organization
from app.models.organization import Organization, OrganizationMember


async def require_selected_organization(
    active: tuple[Organization, OrganizationMember] = Depends(get_current_organization),
) -> tuple[Organization, OrganizationMember]:
    """Attach this dependency to endpoints that require an explicit org context."""
    return active
