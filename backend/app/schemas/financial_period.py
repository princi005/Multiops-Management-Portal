import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.financial_period import PeriodStatus


class FinancialPeriodBase(BaseModel):
    name: str
    start_date: date
    end_date: date


class FinancialPeriodCreate(FinancialPeriodBase):
    pass


class FinancialPeriodRead(FinancialPeriodBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: PeriodStatus
    closed_at: datetime | None
    created_at: datetime