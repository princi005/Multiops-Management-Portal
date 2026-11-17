import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.project import ProjectStatus


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    version: str | None = None
    technology: str | None = None
    requirements_text: str | None = None
    start_date: date | None = None
    end_date: date | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    version: str | None = None
    technology: str | None = None
    requirements_text: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: ProjectStatus | None = None


import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.project import ProjectStatus


class ProjectMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    employee_id: uuid.UUID
    added_at: datetime


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    version: str | None
    technology: str | None
    requirements_text: str | None
    start_date: date | None
    end_date: date | None
    status: ProjectStatus
    manager_id: uuid.UUID
    created_at: datetime
    deleted_at: datetime | None = None
    members: list[ProjectMemberRead]


class AddProjectMember(BaseModel):
    employee_id: uuid.UUID