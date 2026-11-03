"""
HR-submitted requests requiring Accounts approval, per the
HR -> Accounts -> Employee Creation/Exit workflow. One table for both
request types (creation, exit) since they share the same lifecycle.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RequestType(str, enum.Enum):
    CREATION = "creation"
    EXIT = "exit"


class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class EmployeeRequest(Base):
    __tablename__ = "employee_requests"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_type: Mapped[RequestType] = mapped_column(
        Enum(RequestType, name="employee_request_type_enum"), nullable=False
    )
    status: Mapped[RequestStatus] = mapped_column(
        Enum(RequestStatus, name="employee_request_status_enum"),
        default=RequestStatus.PENDING,
        nullable=False,
    )

    # For CREATION requests: onboarding details (email, name, code, dept, etc.)
    # For EXIT requests: {"employee_id": "<uuid>", "reason": "..."}
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)

    requested_by_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    decided_by_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    decision_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    requested_by: Mapped["User"] = relationship(foreign_keys=[requested_by_id])
    decided_by: Mapped["User | None"] = relationship(foreign_keys=[decided_by_id])