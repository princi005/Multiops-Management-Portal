"""
Permission model — fine-grained actions like "employee:read",
"employee:write", "dashboard:ceo:view". Phase 1 endpoints will mostly
check by role (only CEO/HR exist), but this table is wired in from
day one so per-permission checks are a config change later, not a
redesign.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    role_permissions: Mapped[list["RolePermission"]] = relationship(back_populates="permission")