"""
Role-based route protection. Usage on any route:

    @router.get("/some-endpoint")
    async def handler(user: User = Depends(require_role("CEO", "HR"))):
        ...
"""

from fastapi import Depends, HTTPException, status

from app.api.deps import get_current_user
from app.models.user import User


def require_role(*allowed_roles: str):
    async def dependency(user: User = Depends(get_current_user)) -> User:
        user_role_names = {user_role.role.name for user_role in user.user_roles}

        if not user_role_names.intersection(allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource.",
            )
        return user

    return dependency