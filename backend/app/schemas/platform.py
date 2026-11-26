import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PlatformOrganizationUpdate(BaseModel):
    is_active: bool | None = None
    domain: str | None = Field(default=None, max_length=255)
    subscription_plan: str | None = Field(default=None, min_length=2, max_length=40)
    subscription_status: str | None = Field(default=None, min_length=2, max_length=30)
    subscription_reference: str | None = Field(default=None, max_length=120)


class PlatformAuditRead(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    organization_name: str
    actor_user_id: uuid.UUID | None
    action: str
    details: dict[str, Any]
    reason: str | None
    created_at: datetime
