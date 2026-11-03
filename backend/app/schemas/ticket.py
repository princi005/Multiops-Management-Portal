import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.ticket import TicketStatus


class TicketCreate(BaseModel):
    title: str
    description: str | None = None
    parent_ticket_id: uuid.UUID | None = None
    assigned_to_id: uuid.UUID | None = None


class TicketUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    assigned_to_id: uuid.UUID | None = None


class TicketStatusUpdate(BaseModel):
    status: TicketStatus
    note: str | None = None


class TicketLogAdd(BaseModel):
    note: str = Field(min_length=1)


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
    assigned_to_id: uuid.UUID | None
    created_by_id: uuid.UUID
    created_at: datetime
    updated_at: datetime