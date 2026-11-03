import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.employee import AvailabilityStatus, EmploymentStatus
from app.schemas.department import DepartmentRead


class SkillTag(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class EmployeeBase(BaseModel):
    employee_code: str
    designation: str | None = None
    phone: str | None = None
    date_of_joining: date | None = None
    employment_status: EmploymentStatus = EmploymentStatus.ACTIVE
    department_id: uuid.UUID | None = None


class EmployeeCreate(EmployeeBase):
    user_id: uuid.UUID
    full_name: str
    email: EmailStr


class EmployeeUpdate(BaseModel):
    designation: str | None = None
    phone: str | None = None
    date_of_joining: date | None = None
    employment_status: EmploymentStatus | None = None
    department_id: uuid.UUID | None = None


class AvailabilityUpdate(BaseModel):
    availability_status: AvailabilityStatus


class AssignSkill(BaseModel):
    skill_id: uuid.UUID


class EmployeeRead(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    department: DepartmentRead | None = None
    availability_status: AvailabilityStatus


class EmployeeOnboardRequest(BaseModel):
    email: EmailStr
    full_name: str
    temporary_password: str
    employee_code: str
    designation: str | None = None
    phone: str | None = None
    date_of_joining: date | None = None
    department_id: uuid.UUID | None = None
    employment_status: EmploymentStatus = EmploymentStatus.ACTIVE


class PasswordResetResponse(BaseModel):
    employee_id: uuid.UUID
    email: str
    temporary_password: str