import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.profile_change_request import ChangeField, ChangeStatus


class ChangeRequestCreate(BaseModel):
    # Free text by default; "full_name" and "phone" stay available to API callers.
    field: ChangeField = ChangeField.GENERAL
    new_value: str = Field(min_length=1, max_length=2000)
    reason: str | None = Field(default=None, max_length=500)

    @field_validator("reason")
    @classmethod
    def _blank_reason_is_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ChangeDecision(BaseModel):
    decision_note: str | None = Field(default=None, max_length=500)


class ChangeRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    field: ChangeField
    old_value: str | None
    new_value: str
    reason: str | None
    status: ChangeStatus
    decision_note: str | None
    decided_at: datetime | None
    created_at: datetime


class ChangeRequestHRRead(ChangeRequestRead):
    organization_id: uuid.UUID | None
    employee_id: uuid.UUID
    employee_code: str
    employee_name: str | None
    employee_email: str

class ChangeEvidenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    request_id: uuid.UUID
    original_filename: str
    content_type: str
    size_bytes: int
    uploaded_at: datetime
