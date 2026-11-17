import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.employee_issue import IssueCategory, IssueStatus


class IssueCreate(BaseModel):
    category: IssueCategory
    subject: str = Field(min_length=1, max_length=300)
    description: str = Field(min_length=1, max_length=5000)


class IssueRespond(BaseModel):
    status: Literal["in_progress", "resolved"]
    response: str | None = Field(default=None, max_length=3000)


class IssueRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    category: IssueCategory
    subject: str
    description: str
    status: IssueStatus
    response: str | None
    resolved_at: datetime | None
    created_at: datetime
    updated_at: datetime


class IssueForAccountsRead(IssueRead):
    employee_id: uuid.UUID
    employee_code: str
    employee_name: str | None
    employee_email: str