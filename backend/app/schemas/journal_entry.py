import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.journal_entry import JournalEntryStatus


class JournalEntryLineInput(BaseModel):
    gl_account_id: uuid.UUID
    department_id: uuid.UUID | None = None
    party_id: uuid.UUID | None = None
    debit: float = Field(default=0, ge=0)
    credit: float = Field(default=0, ge=0)
    line_description: str | None = None


class JournalEntryLineRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    gl_account_id: uuid.UUID
    department_id: uuid.UUID | None
    party_id: uuid.UUID | None
    debit: float
    credit: float
    line_description: str | None


class JournalEntryCreate(BaseModel):
    period_id: uuid.UUID
    entry_date: date
    reference: str | None = None
    description: str
    lines: list[JournalEntryLineInput]


class JournalEntryUpdate(BaseModel):
    entry_date: date
    reference: str | None = None
    description: str
    lines: list[JournalEntryLineInput]
    reason: str = Field(min_length=3)


class JournalEntryDelete(BaseModel):
    reason: str = Field(min_length=3)


class JournalEntryRestore(BaseModel):
    reason: str = Field(min_length=3)


class JournalEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    period_id: uuid.UUID
    entry_date: date
    reference: str | None
    description: str
    status: JournalEntryStatus
    created_by_id: uuid.UUID
    created_at: datetime
    deleted_at: datetime | None
    deleted_by_id: uuid.UUID | None
    lines: list[JournalEntryLineRead]