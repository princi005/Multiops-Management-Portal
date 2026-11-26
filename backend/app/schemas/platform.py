import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field


class PlatformOrganizationUpdate(BaseModel):
    is_active: bool | None = None
    domain: str | None = Field(default=None, max_length=255)
    subscription_plan: str | None = Field(default=None, min_length=2, max_length=40)
    subscription_status: str | None = Field(default=None, min_length=2, max_length=30)
    subscription_reference: str | None = Field(default=None, max_length=120)
    subscription_expires_at: datetime | None = None
    subscription_renews_at: datetime | None = None


class PlatformOrganizationAdminRead(BaseModel):
    user_id: uuid.UUID
    email: str
    full_name: str | None


class PlatformOrganizationRead(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    domain: str | None
    company_prefix: str
    is_active: bool
    subscription_plan: str
    subscription_status: str
    subscription_reference: str | None
    subscription_expires_at: datetime | None
    subscription_renews_at: datetime | None
    subscription_rate_amount: Decimal | None
    subscription_rate_currency: str | None
    subscription_rate_period: str | None
    active_user_count: int
    organization_admins: list[PlatformOrganizationAdminRead]
    created_at: datetime

class OrganizationSubscriptionRateUpdate(BaseModel):
    subscription_rate_amount: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    subscription_rate_currency: str = Field(pattern=r"^[A-Z]{3}$")
    subscription_rate_period: str = Field(min_length=1, max_length=40)


class OrganizationSubscriptionRateRead(BaseModel):
    organization_id: uuid.UUID
    subscription_rate_amount: Decimal | None
    subscription_rate_currency: str | None
    subscription_rate_period: str | None

class PlatformAuditRead(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    organization_name: str
    actor_user_id: uuid.UUID | None
    action: str
    details: dict[str, Any]
    reason: str | None
    created_at: datetime
