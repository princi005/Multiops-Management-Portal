"""
Role-based and ownership-based route protection.

require_role(...) - unchanged, role-level checks like require_role("HR").

require_self_or_role(get_owner_id, *roles) - row-level checks. Allows
access if the current user IS the owner of the resource (per
get_owner_id, called with the route's path params), OR if they hold one
of the given roles. This is what lets a Manager see only their own
projects, or an Employee see only their own profile, without a role
existing for every single person.
"""

import inspect
from typing import Callable

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


def require_self_or_role(get_owner_id: Callable, *allowed_roles: str):
    """
    get_owner_id: a function (sync or async) that takes the same path
    params as the route and returns the owning user's UUID. Called
    with keyword args matching the route's path parameter names.
    """

    async def dependency(user: User = Depends(get_current_user), **path_params) -> User:
        user_role_names = {user_role.role.name for user_role in user.user_roles}
        if user_role_names.intersection(allowed_roles):
            return user

        result = get_owner_id(**path_params)
        owner_id = await result if inspect.isawaitable(result) else result

        if owner_id == user.id:
            return user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource.",
        )

    return dependency