"""
Pydantic schemas for Employee.
"""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.employee import EmploymentStatus
from app.schemas.department import DepartmentRead


class EmployeeBase(BaseModel):
    employee_code: str
    designation: str | None = None
    phone: str | None = None
    date_of_joining: date | None = None
    employment_status: EmploymentStatus = EmploymentStatus.ACTIVE
    department_id: uuid.UUID | None = None


class EmployeeCreate(EmployeeBase):
    """
    Used when HR creates a new employee. Requires an existing user_id
    (the employee must already have a Supabase Auth + users row —
    account provisioning is a separate concern from HR record creation).
    """

    user_id: uuid.UUID
    full_name: str
    email: EmailStr


class EmployeeUpdate(BaseModel):
    """All fields optional — partial update (PATCH semantics)."""

    designation: str | None = None
    phone: str | None = None
    date_of_joining: date | None = None
    employment_status: EmploymentStatus | None = None
    department_id: uuid.UUID | None = None


class EmployeeRead(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    department: DepartmentRead | None = None

class EmployeeOnboardRequest(BaseModel):
    """
    HR-only: creates a brand-new employee, including their login account.
    """

    email: EmailStr
    full_name: str
    temporary_password: str
    employee_code: str
    designation: str | None = None
    phone: str | None = None
    date_of_joining: date | None = None
    department_id: uuid.UUID | None = None
    employment_status: EmploymentStatus = EmploymentStatus.ACTIVE