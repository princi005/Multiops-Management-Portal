import uuid

from pydantic import BaseModel


class TrialBalanceLine(BaseModel):
    gl_account_id: uuid.UUID
    code: str
    name: str
    account_type: str
    total_debit: float
    total_credit: float
    balance: float


class TrialBalanceReport(BaseModel):
    period_id: uuid.UUID
    period_name: str
    lines: list[TrialBalanceLine]
    total_debit: float
    total_credit: float
    is_balanced: bool