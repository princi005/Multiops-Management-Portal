"""
Immutable salary history. Every payroll profile create or update appends
one row here; existing rows are never modified or deleted. Separate from
the generic audit_logs table so payroll-specific fields stay directly
queryable/exportable without parsing a JSON snapshot.
"""

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SalaryHistory(Base):
    __tablename__ = "salary_history"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )

    basic_salary: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    allowances: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    deductions: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    benefits: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    pan: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bank_account_number: Mapped[str | None] = mapped_column(String(34), nullable=True)
    ifsc: Mapped[str | None] = mapped_column(String(11), nullable=True)

    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    action: Mapped[str] = mapped_column(String(20), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    changed_by_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    employee: Mapped["Employee"] = relationship()
    changed_by: Mapped["User | None"] = relationship()