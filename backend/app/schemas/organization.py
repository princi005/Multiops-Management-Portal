import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class OrganizationMemberCreate(BaseModel):
    user_id: uuid.UUID
    role: str = Field(default="employee", min_length=2, max_length=40)


class OrganizationMemberUpdate(BaseModel):
    role: str | None = Field(default=None, min_length=2, max_length=40)
    is_active: bool | None = None


class OrganizationMemberRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    email: str
    full_name: str | None
    role: str
    is_active: bool
    created_at: datetime


class OrganizationAuditRead(BaseModel):
    id: uuid.UUID
    actor_user_id: uuid.UUID | None
    action: str
    details: dict[str, Any]
    reason: str | None
    created_at: datetime


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=80)
    initial_admin_user_id: uuid.UUID
    domain: str | None = Field(default=None, max_length=255)


class OrganizationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    domain: str | None
    company_prefix: str
    is_active: bool
    subscription_plan: str
    subscription_status: str
    created_at: datetime


class MembershipRead(BaseModel):
    organization: OrganizationRead
    role: str


class OrganizationConfig(BaseModel):
    company_prefix: str = Field(default="MTO", min_length=2, max_length=12, pattern=r"^[A-Za-z0-9]+$")
    departments: list[dict[str, Any]] = Field(default_factory=list)
    roles: list[dict[str, Any]] = Field(default_factory=list)
    features: dict[str, bool] = Field(default_factory=dict)
    priorities: list[str] = Field(default_factory=lambda: ["low", "normal", "high", "urgent"])
    inbox_retention_days: int = Field(default=15, ge=1, le=3650)
    audit_retention_years: int = Field(default=1, ge=1, le=50)
    employee_id_format: str = Field(default="{company}-{department}-{number}", max_length=80)
    legal_name_approvers: list[str] = Field(default_factory=lambda: ["HR"])

    @field_validator("priorities")
    @classmethod
    def validate_priorities(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip() for value in values]
        normalized = [value.casefold() for value in cleaned]
        if not cleaned or any(not value for value in cleaned):
            raise ValueError("Add at least one non-empty ticket priority.")
        if len(cleaned) != len(set(normalized)):
            raise ValueError("Ticket priorities must be unique.")
        if "normal" not in normalized:
            raise ValueError("Keep the normal priority because it is the default for new tickets.")
        if any(len(value) > 30 for value in cleaned):
            raise ValueError("Ticket priority values must be 30 characters or fewer.")
        return cleaned

