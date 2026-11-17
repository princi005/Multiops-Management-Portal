import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: str
    title: str
    message: str
    related_project_id: uuid.UUID | None
    related_ticket_id: uuid.UUID | None
    created_at: datetime
    read_at: datetime | None


class RequestTicketUpdate(BaseModel):
    message: str | None = Field(default=None, max_length=2000)
