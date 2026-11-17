from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.directory import DirectoryEmployee
from app.services import directory_service

router = APIRouter(prefix="/directory", tags=["directory"])


@router.get("/employees", response_model=list[DirectoryEmployee])
async def list_directory_employees(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("Manager")),
):
    return await directory_service.list_active_employees(db)