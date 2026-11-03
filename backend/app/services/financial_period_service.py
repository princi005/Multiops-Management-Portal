import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.financial_period import FinancialPeriod, PeriodStatus
from app.models.user import User
from app.schemas.financial_period import FinancialPeriodCreate


async def list_periods(db: AsyncSession) -> list[FinancialPeriod]:
    result = await db.execute(select(FinancialPeriod).order_by(FinancialPeriod.start_date))
    return list(result.scalars().all())


async def create_period(db: AsyncSession, payload: FinancialPeriodCreate) -> FinancialPeriod:
    result = await db.execute(select(FinancialPeriod).where(FinancialPeriod.name == payload.name))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A period with this name already exists.")

    period = FinancialPeriod(id=uuid.uuid4(), **payload.model_dump())
    db.add(period)
    await db.commit()
    await db.refresh(period)
    return period


async def close_period(db: AsyncSession, period_id: uuid.UUID, closed_by: User) -> FinancialPeriod:
    result = await db.execute(select(FinancialPeriod).where(FinancialPeriod.id == period_id))
    period = result.scalar_one_or_none()
    if period is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Period not found.")
    if period.status == PeriodStatus.CLOSED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Period is already closed.")

    period.status = PeriodStatus.CLOSED
    period.closed_at = datetime.now(timezone.utc)
    period.closed_by_id = closed_by.id
    await db.commit()
    await db.refresh(period)
    return period