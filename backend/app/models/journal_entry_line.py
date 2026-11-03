"""
Journal entry lines. Each line is either a debit or a credit against
one GL account (never both) - enforced in the service layer.
department_id and party_id are optional dimension tagging
(department-wise, party-wise ledger reporting); project_id will be
added once a projects table exists.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class JournalEntryLine(Base):
    __tablename__ = "journal_entry_lines"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    journal_entry_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("journal_entries.id", ondelete="CASCADE"), nullable=False
    )
    gl_account_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("gl_accounts.id", ondelete="RESTRICT"), nullable=False
    )
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    party_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("parties.id", ondelete="SET NULL"), nullable=True
    )

    debit: Mapped[float] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    credit: Mapped[float] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    line_description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    journal_entry: Mapped["JournalEntry"] = relationship(back_populates="lines")
    gl_account: Mapped["GLAccount"] = relationship()
    department: Mapped["Department | None"] = relationship()
    party: Mapped["Party | None"] = relationship()