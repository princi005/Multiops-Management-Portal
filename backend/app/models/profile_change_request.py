"""
A request by an employee to change something in their profile. Two kinds:

- full_name / phone: HR approves and the change is applied automatically.
- general: free text ("update my address to ..."). Nothing is applied
  automatically; HR makes the change by hand and marks the request done.

Status and field are stored as plain text with a check constraint rather than
a database enum type, which keeps the migration simple. At most one PENDING
request per employee per name/phone field is allowed (partial unique index), so
double clicks and races cannot create duplicates. General requests are not
limited by the index (a person may have several different ones); the service
caps how many can be pending.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Index, Text, func, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ChangeField(str, enum.Enum):
    FULL_NAME = "full_name"
    PHONE = "phone"
    GENERAL = "general"


class ChangeStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


def _values(enum_class: type[enum.Enum]) -> list[str]:
    return [member.value for member in enum_class]


class ProfileChangeRequest(Base):
    __tablename__ = "profile_change_requests"
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'approved', 'rejected', 'cancelled')", name="ck_profile_change_status"),
        CheckConstraint("field IN ('full_name', 'phone', 'general')", name="ck_profile_change_field"),
        Index(
            "uq_profile_change_one_pending",
            "employee_id",
            "field",
            unique=True,
            postgresql_where=text("status = 'pending' AND field <> 'general'"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    field: Mapped[ChangeField] = mapped_column(
        Enum(ChangeField, native_enum=False, length=30, values_callable=_values), nullable=False
    )
    status: Mapped[ChangeStatus] = mapped_column(
        Enum(ChangeStatus, native_enum=False, length=20, values_callable=_values),
        default=ChangeStatus.PENDING,
        nullable=False,
    )
    old_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value: Mapped[str] = mapped_column(Text, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_by_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    decision_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )