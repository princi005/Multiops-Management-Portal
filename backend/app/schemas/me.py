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


class MyPersonalDetailsRead(BaseModel):
    model_config = {"from_attributes": True}

    employee_id: uuid.UUID
    organization_id: uuid.UUID
    personal_email: str | None = None
    date_of_birth: date | None = None
    linkedin_url: str | None = None
    about: str | None = None
    hobbies: str | None = None
    current_address: str | None = None
    permanent_address: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_relationship: str | None = None
    emergency_contact_phone: str | None = None
    married: bool = False
    spouse_name: str | None = None
    spouse_profession: str | None = None
    children: str | None = None
    parents_or_guardians: str | None = None
    blood_group: str | None = None
    allergies: str | None = None
    health_conditions: str | None = None
    medications: str | None = None
    birthday_visible: bool = True
    work_anniversary_visible: bool = True
    updated_at: datetime | None = None


class MyPersonalDetailsUpdate(BaseModel):
    personal_email: str | None = Field(default=None, max_length=255)
    date_of_birth: date | None = None
    linkedin_url: str | None = Field(default=None, max_length=500)
    about: str | None = None
    hobbies: str | None = None
    current_address: str | None = None
    permanent_address: str | None = None
    emergency_contact_name: str | None = Field(default=None, max_length=200)
    emergency_contact_relationship: str | None = Field(default=None, max_length=100)
    emergency_contact_phone: str | None = Field(default=None, max_length=30)
    married: bool | None = None
    spouse_name: str | None = Field(default=None, max_length=200)
    spouse_profession: str | None = Field(default=None, max_length=200)
    children: str | None = None
    parents_or_guardians: str | None = None
    blood_group: str | None = Field(default=None, max_length=3)
    allergies: str | None = None
    health_conditions: str | None = None
    medications: str | None = None
    birthday_visible: bool | None = None
    work_anniversary_visible: bool | None = None

class ProfileExperienceRead(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    company: str
    role: str
    duration: str
    description: str | None
    created_at: datetime
    updated_at: datetime


class ProfileExperienceCreate(BaseModel):
    company: str = Field(min_length=1, max_length=160)
    role: str = Field(min_length=1, max_length=120)
    duration: str = Field(min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=10000)

    @field_validator("company", "role", "duration")
    @classmethod
    def clean_required_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field cannot be empty.")
        return cleaned

    @field_validator("description")
    @classmethod
    def limit_description_words(cls, value: str | None) -> str | None:
        if value is not None and len(value.split()) > 1000:
            raise ValueError("Experience descriptions can contain at most 1,000 words.")
        return value


class ProfileExperienceUpdate(BaseModel):
    company: str | None = Field(default=None, min_length=1, max_length=160)
    role: str | None = Field(default=None, min_length=1, max_length=120)
    duration: str | None = Field(default=None, min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=10000)

    @field_validator("company", "role", "duration")
    @classmethod
    def clean_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field cannot be empty.")
        return cleaned

    @field_validator("description")
    @classmethod
    def limit_description_words(cls, value: str | None) -> str | None:
        if value is not None and len(value.split()) > 1000:
            raise ValueError("Experience descriptions can contain at most 1,000 words.")
        return value


class ProfileCourseRead(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    created_at: datetime
    updated_at: datetime


class ProfileCourseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Course name cannot be empty.")
        return cleaned


class ProfileCourseUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=200)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Course name cannot be empty.")
        return cleaned


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