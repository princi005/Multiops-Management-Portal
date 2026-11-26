import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


IdentityDocumentType = Literal["pan", "aadhaar"]


class IdentityDocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_type: IdentityDocumentType
    original_filename: str
    content_type: str
    size_bytes: int
    is_verified: bool
    verified_at: datetime | None
    uploaded_at: datetime