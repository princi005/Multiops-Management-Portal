import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.employee_request import RequestStatus, RequestType


class CreationRequestPayload(BaseModel):
    # No password field: the server generates a temporary password at
    # approval time and never stores it.
    email: EmailStr
    full_name: str
    employee_code: str
    designation: str | None = None
    phone: str | None = None
    date_of_joining: date | None = None
    department_id: uuid.UUID | None = None
    proposed_basic_salary: float | None = Field(default=None, gt=0)


class ExitRequestPayload(BaseModel):
    employee_id: uuid.UUID
    reason: str | None = None
    employee_code: str | None = None  # filled in by the server for display


class EmployeeRequestCreate(BaseModel):
    request_type: RequestType
    payload: dict


class EmployeeRequestDecision(BaseModel):
    decision_note: str | None = None

    # Only used when approving a CREATION request. basic_salary falls
    # back to the request's proposed_basic_salary if omitted here.
    basic_salary: float | None = Field(default=None, gt=0)
    allowances: dict[str, float] = Field(default_factory=dict)
    deductions: dict[str, float] = Field(default_factory=dict)
    benefits: dict[str, float] = Field(default_factory=dict)
    pan: str | None = None
    bank_account_number: str | None = None
    ifsc: str | None = None
    effective_date: date | None = None


class EmployeeRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    request_type: RequestType
    status: RequestStatus
    payload: dict
    requested_by_id: uuid.UUID
    decided_by_id: uuid.UUID | None
    decision_note: str | None
    decided_at: datetime | None
    created_at: datetime


class EmployeeRequestApproval(EmployeeRequestRead):
    temporary_password: str | None = None