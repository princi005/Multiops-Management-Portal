import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.ticket import TicketStatus


ApprovalStatus = Literal["not_requested", "pending", "approved", "rejected"]


class TicketCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    parent_ticket_id: uuid.UUID | None = None
    assigned_to_id: uuid.UUID | None = None
    priority: str = Field(default="normal", min_length=1, max_length=30)
    due_date: date | None = None

    @field_validator("title", "priority")
    @classmethod
    def trim_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Value cannot be blank.")
        return value


class TicketUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    assigned_to_id: uuid.UUID | None = None
    priority: str | None = Field(default=None, min_length=1, max_length=30)
    progress_percent: int | None = Field(default=None, ge=0, le=100)
    due_date: date | None = None


class TicketStatusUpdate(BaseModel):
    status: TicketStatus
    note: str | None = None


class TicketApprovalUpdate(BaseModel):
    status: ApprovalStatus
    note: str | None = Field(default=None, max_length=1000)


class TicketLogAdd(BaseModel):
    note: str = Field(min_length=1, max_length=5000)


class TicketLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    note: str
    status_from: str | None
    status_to: str | None
    logged_by_id: uuid.UUID | None
    created_at: datetime


class TicketRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    parent_ticket_id: uuid.UUID | None
    title: str
    description: str | None
    status: TicketStatus
    priority: str
    progress_percent: int
    due_date: date | None
    approval_status: ApprovalStatus
    assigned_to_id: uuid.UUID | None
    created_by_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
