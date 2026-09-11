"""
CEO dashboard endpoint.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.dashboard import CeoDashboardSummary
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/ceo", response_model=CeoDashboardSummary)
async def ceo_dashboard(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO")),
):
    return await dashboard_service.get_ceo_summary(db)