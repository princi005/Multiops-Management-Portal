"""
Payroll profile: one current row per employee holding their active
salary/payroll configuration. This is master/configuration data only -
creating or updating it never posts a journal entry. Every create or
update also appends an immutable row to salary_history, so this table
can be safely overwritten in place while history never is.
"""

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PayFrequency(str, enum.Enum):
    MONTHLY = "monthly"


class PayrollProfileStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class PayrollProfile(Base):
    __tablename__ = "payroll_profiles"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    basic_salary: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    pay_frequency: Mapped[PayFrequency] = mapped_column(
        Enum(PayFrequency, name="pay_frequency_enum"), default=PayFrequency.MONTHLY, nullable=False
    )
    allowances: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    deductions: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    benefits: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    pan: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bank_account_number: Mapped[str | None] = mapped_column(String(34), nullable=True)
    ifsc: Mapped[str | None] = mapped_column(String(11), nullable=True)

    status: Mapped[PayrollProfileStatus] = mapped_column(
        Enum(PayrollProfileStatus, name="payroll_profile_status_enum"),
        default=PayrollProfileStatus.ACTIVE,
        nullable=False,
    )
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    employee: Mapped["Employee"] = relationship()