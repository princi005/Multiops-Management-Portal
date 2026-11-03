import uuid
from datetime import datetime

from pydantic import BaseModel


class AuditLogRead(BaseModel):
    id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    action: str
    reason: str
    previous_value: dict | None
    new_value: dict | None
    changed_by_id: uuid.UUID | None
    changed_by_email: str | None
    created_at: datetime