import re
import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from app.models.employee import AvailabilityStatus, EmploymentStatus
from app.models.payroll_profile import PayFrequency
from app.schemas.employee import SkillTag

MAX_SKILLS = 50
MAX_SKILL_LENGTH = 50
_SKILL_PATTERN = re.compile(r"^[\w.][\w .+#/&()\-]*$")


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


class MySkillsUpdate(BaseModel):
    skills: list[str] = Field(max_length=MAX_SKILLS)

    @field_validator("skills")
    @classmethod
    def _clean_skills(cls, values: list[str]) -> list[str]:
        cleaned: list[str] = []
        seen: set[str] = set()
        for raw in values:
            name = " ".join(raw.split())
            if not name:
                continue
            if len(name) > MAX_SKILL_LENGTH:
                raise ValueError(f"Skill names can be at most {MAX_SKILL_LENGTH} characters.")
            if not _SKILL_PATTERN.match(name):
                raise ValueError(f"'{name}' contains characters that are not allowed in a skill name.")
            key = name.lower()
            if key not in seen:
                seen.add(key)
                cleaned.append(name)
        return cleaned


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