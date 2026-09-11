"""
Pydantic schemas for Department — request/response shapes for the API.
Separate from the SQLAlchemy model (app/models/department.py) on purpose:
the DB model describes storage, these describe the API contract.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DepartmentBase(BaseModel):
    name: str
    description: str | None = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentRead(DepartmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime