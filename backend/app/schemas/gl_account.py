import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.gl_account import AccountType


class GLAccountBase(BaseModel):
    code: str
    name: str
    account_type: AccountType
    parent_account_id: uuid.UUID | None = None
    description: str | None = None
    is_active: bool = True


class GLAccountCreate(GLAccountBase):
    pass


class GLAccountRead(GLAccountBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime