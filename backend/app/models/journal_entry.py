"""
Journal entry header. Belongs to one financial period and must balance
(sum of line debits == sum of line credits) - enforced in
app/services/journal_entry_service.py, not here.

deleted_at/deleted_by_id implement a soft delete: a mistaken entry is
marked deleted, not removed, so it can be restored and stays in the
audit trail. Reports must exclude deleted entries explicitly.
"""

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class JournalEntryStatus(str, enum.Enum):
    DRAFT = "draft"
    POSTED = "posted"


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    period_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("financial_periods.id", ondelete="RESTRICT"), nullable=False
    )
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[JournalEntryStatus] = mapped_column(
        Enum(JournalEntryStatus, name="journal_entry_status_enum"),
        default=JournalEntryStatus.POSTED,
        nullable=False,
    )

    created_by_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_by_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    period: Mapped["FinancialPeriod"] = relationship()
    created_by: Mapped["User"] = relationship(foreign_keys=[created_by_id])
    deleted_by: Mapped["User | None"] = relationship(foreign_keys=[deleted_by_id])
    lines: Mapped[list["JournalEntryLine"]] = relationship(
        back_populates="journal_entry", cascade="all, delete-orphan"
    )