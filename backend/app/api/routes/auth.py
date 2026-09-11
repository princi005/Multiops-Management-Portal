"""
/auth/me — proves the full auth pipeline works: token verification,
JWKS signature check, and DB user lookup with roles.
"""

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
async def read_current_user(user: User = Depends(get_current_user)):
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "roles": [user_role.role.name for user_role in user.user_roles],
    }