"""
Tickets (tasks). parent_ticket_id makes subtasks - a ticket with a
parent is a subtask of it; self-referential, one level deep in
practice though the schema allows more.

Status transitions are enforced in services/ticket_service.py:
Manager has full control; an assigned Employee may move between
not_started/in_progress/completed/for_review on their own ticket, but
only a Manager can set cancelled or dropped.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TicketStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FOR_REVIEW = "for_review"
    CANCELLED = "cancelled"
    DROPPED = "dropped"


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    parent_ticket_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus, name="ticket_status_enum"), default=TicketStatus.NOT_STARTED, nullable=False
    )
    assigned_to_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    created_by_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    project: Mapped["Project"] = relationship()
    parent: Mapped["Ticket | None"] = relationship(remote_side=[id], back_populates="subtasks")
    subtasks: Mapped[list["Ticket"]] = relationship(back_populates="parent")
    assigned_to: Mapped["Employee | None"] = relationship()
    logs: Mapped[list["TicketLog"]] = relationship(back_populates="ticket", cascade="all, delete-orphan")