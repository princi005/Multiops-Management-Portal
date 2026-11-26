import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


AssetStatus = Literal["in_use", "needs_attention", "under_repair"]
AssetRequestType = Literal["repair", "replacement", "other_issue"]
AssetRequestStatus = Literal["open", "in_progress", "resolved", "withdrawn"]


class EmployeeAssetAssign(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    device_id: str = Field(min_length=1, max_length=80)
    status: AssetStatus = "in_use"

    @field_validator("name", "device_id")
    @classmethod
    def clean_required_value(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field cannot be empty.")
        return cleaned


class EmployeeAssetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    device_id: str
    status: AssetStatus
    created_at: datetime


class EmployeeAssetRequestCreate(BaseModel):
    asset_id: uuid.UUID
    request_type: AssetRequestType
    details: str = Field(min_length=10, max_length=1200)

    @field_validator("details")
    @classmethod
    def clean_details(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 10:
            raise ValueError("Describe the issue in at least 10 characters.")
        return cleaned


class EmployeeAssetRequestRespond(BaseModel):
    status: Literal["in_progress", "resolved"]
    response: str | None = Field(default=None, max_length=3000)

    @field_validator("response")
    @classmethod
    def clean_response(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class EmployeeAssetRequestRead(BaseModel):
    id: uuid.UUID
    asset_id: uuid.UUID
    asset_name: str
    device_id: str
    request_type: AssetRequestType
    support_team: str
    details: str
    status: AssetRequestStatus
    response: str | None
    resolved_at: datetime | None
    created_at: datetime
    updated_at: datetime


class EmployeeAssetRequestForITRead(EmployeeAssetRequestRead):
    employee_id: uuid.UUID
    employee_code: str
    employee_name: str | None
    employee_email: str