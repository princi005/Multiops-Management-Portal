import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.reports import TrialBalanceReport
from app.services import reports_service

router = APIRouter(prefix="/gl/reports", tags=["general-ledger"])


@router.get("/trial-balance", response_model=TrialBalanceReport)
async def trial_balance(
    period_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO", "Accounts")),
):
    return await reports_service.get_trial_balance(db, period_id)