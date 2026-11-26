"""
An issue an employee raises with Accounts about their salary, payslip or
attendance (or anything else). Accounts moves it to in progress or resolved
and leaves a response; the employee can withdraw it while it is still open.

Category and status are stored as plain text with check constraints rather
than database enum types, which keeps the migration simple.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class IssueCategory(str, enum.Enum):
    SALARY = "salary"
    PAYSLIP = "payslip"
    ATTENDANCE = "attendance"
    OTHER = "other"


class IssueStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    WITHDRAWN = "withdrawn"


def _values(enum_class: type[enum.Enum]) -> list[str]:
    return [member.value for member in enum_class]


class EmployeeIssue(Base):
    __tablename__ = "employee_issues"
    __table_args__ = (
        CheckConstraint(
            "category IN ('salary', 'payslip', 'attendance', 'other')", name="ck_employee_issue_category"
        ),
        CheckConstraint(
            "status IN ('open', 'in_progress', 'resolved', 'withdrawn')", name="ck_employee_issue_status"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category: Mapped[IssueCategory] = mapped_column(
        Enum(IssueCategory, native_enum=False, length=20, values_callable=_values), nullable=False
    )
    status: Mapped[IssueStatus] = mapped_column(
        Enum(IssueStatus, native_enum=False, length=20, values_callable=_values),
        default=IssueStatus.OPEN,
        nullable=False,
    )
    subject: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    response: Mapped[str | None] = mapped_column(Text, nullable=True)
    handled_by_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

class EmployeeAsset(Base):
    __tablename__ = "employee_assets"
    __table_args__ = (
        UniqueConstraint("organization_id", "device_id", name="uq_employee_assets_org_device_id"),
        CheckConstraint(
            "status IN ('in_use', 'needs_attention', 'under_repair')",
            name="ck_employee_assets_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    device_id: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="in_use", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class EmployeeAssetRequest(Base):
    __tablename__ = "employee_asset_requests"
    __table_args__ = (
        CheckConstraint(
            "request_type IN ('repair', 'replacement', 'other_issue')",
            name="ck_employee_asset_requests_type",
        ),
        CheckConstraint(
            "status IN ('open', 'in_progress', 'resolved', 'withdrawn')",
            name="ck_employee_asset_requests_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    asset_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("employee_assets.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    request_type: Mapped[str] = mapped_column(String(20), nullable=False)
    support_team: Mapped[str] = mapped_column(String(40), default="IT", nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False)
    response: Mapped[str | None] = mapped_column(Text, nullable=True)
    handled_by_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
