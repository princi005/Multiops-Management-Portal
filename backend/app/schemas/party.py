import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.party import PartyType


class PartyBase(BaseModel):
    party_type: PartyType
    name: str
    email: str | None = None
    phone: str | None = None
    tax_id: str | None = None
    address: str | None = None
    is_active: bool = True


class PartyCreate(PartyBase):
    pass


class PartyRead(PartyBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime