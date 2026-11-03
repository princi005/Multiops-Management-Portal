import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.payroll_profile import PayFrequency, PayrollProfileStatus


class PayrollProfileInput(BaseModel):
    basic_salary: float = Field(gt=0)
    pay_frequency: PayFrequency = PayFrequency.MONTHLY
    allowances: dict[str, float] = Field(default_factory=dict)
    deductions: dict[str, float] = Field(default_factory=dict)
    benefits: dict[str, float] = Field(default_factory=dict)
    pan: str | None = None
    bank_account_number: str | None = None
    ifsc: str | None = None
    effective_date: date | None = None


class PayrollProfileUpdate(PayrollProfileInput):
    reason: str = Field(min_length=3)


class PayrollProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_id: uuid.UUID
    basic_salary: float
    pay_frequency: PayFrequency
    allowances: dict
    deductions: dict
    benefits: dict
    pan: str | None
    bank_account_number: str | None
    ifsc: str | None
    status: PayrollProfileStatus
    effective_date: date
    created_at: datetime
    updated_at: datetime


class PayrollProfileWithEmployee(PayrollProfileRead):
    employee_code: str
    employee_designation: str | None


class SalaryHistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_id: uuid.UUID
    basic_salary: float
    allowances: dict
    deductions: dict
    benefits: dict
    pan: str | None
    bank_account_number: str | None
    ifsc: str | None
    effective_date: date
    action: str
    reason: str
    changed_by_id: uuid.UUID | None
    changed_by_email: str | None
    created_at: datetime