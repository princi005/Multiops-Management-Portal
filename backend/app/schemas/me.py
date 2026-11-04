import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.models.employee import AvailabilityStatus, EmploymentStatus
from app.models.payroll_profile import PayFrequency
from app.schemas.employee import SkillTag


class MyProfile(BaseModel):
    employee_id: uuid.UUID
    employee_code: str
    full_name: str | None
    email: str
    designation: str | None
    phone: str | None
    date_of_joining: date | None
    department_name: str | None
    employment_status: EmploymentStatus
    availability_status: AvailabilityStatus
    skills: list[SkillTag]
    roles: list[str]


class MySalaryHistoryItem(BaseModel):
    effective_date: date
    basic_salary: float
    allowances: dict
    deductions: dict
    benefits: dict
    action: str
    created_at: datetime


class MySalary(BaseModel):
    basic_salary: float
    pay_frequency: PayFrequency
    allowances: dict
    deductions: dict
    benefits: dict
    pan: str | None
    bank_account_number: str | None
    ifsc: str | None
    effective_date: date
    history: list[MySalaryHistoryItem]