import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.financial_period import FinancialPeriodCreate, FinancialPeriodRead
from app.services import financial_period_service

router = APIRouter(prefix="/gl/periods", tags=["general-ledger"])


@router.get("", response_model=list[FinancialPeriodRead])
async def list_periods(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO", "Accounts")),
):
    return await financial_period_service.list_periods(db)


@router.post("", response_model=FinancialPeriodRead, status_code=201)
async def create_period(
    payload: FinancialPeriodCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("Accounts")),
):
    return await financial_period_service.create_period(db, payload)


@router.post("/{period_id}/close", response_model=FinancialPeriodRead)
async def close_period(
    period_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("Accounts")),
):
    return await financial_period_service.close_period(db, period_id, current_user)