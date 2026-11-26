"""
Ticket status rules:
  - Manager: any status, including cancelled/dropped, and may also move
    a ticket OUT of cancelled/dropped (reopen it).
  - Employee: only on a ticket assigned to them, only among
    not_started / in_progress / completed / for_review, and only while
    the ticket is not currently cancelled/dropped (reopening is
    manager-only too).
Every status change writes a TicketLog row automatically. Anyone with
project access can also add a free-text log note without changing status.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ticket import Ticket, TicketStatus
from app.models.ticket_log import TicketLog
from app.models.organization import OrganizationSettings
from app.models.user import User
from app.schemas.ticket import TicketApprovalUpdate, TicketCreate, TicketLogAdd, TicketStatusUpdate, TicketUpdate
from app.services.project_service import ensure_project_access, load_project, require_owning_manager

MANAGER_ONLY_STATUSES = {TicketStatus.CANCELLED, TicketStatus.DROPPED}
EMPLOYEE_ALLOWED_STATUSES = {
    TicketStatus.NOT_STARTED,
    TicketStatus.IN_PROGRESS,
    TicketStatus.COMPLETED,
    TicketStatus.FOR_REVIEW,
}


async def _get_ticket(db: AsyncSession, ticket_id: uuid.UUID) -> Ticket:
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")
    return ticket


def _validate_assignee(project, assigned_to_id: uuid.UUID | None) -> None:
    if assigned_to_id is None:
        return
    if assigned_to_id == project.manager_id:
        return
    if any(m.employee_id == assigned_to_id for m in project.members):
        return
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned employee is not a member of this project.")


async def _validate_priority(db: AsyncSession, organization_id: uuid.UUID, priority: str) -> str:
    settings = await db.get(OrganizationSettings, organization_id)
    config = settings.config if settings else {}
    configured = config.get("priorities") or ["low", "normal", "high", "urgent"]
    match = next((item for item in configured if item.casefold() == priority.strip().casefold()), None)
    if match is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Priority is not enabled for this organization.",
        )
    return match

async def list_tickets(db: AsyncSession, project_id: uuid.UUID, user: User) -> list[Ticket]:
    project = await load_project(db, project_id)
    await ensure_project_access(db, project, user)
    result = await db.execute(select(Ticket).where(Ticket.project_id == project_id).order_by(Ticket.created_at))
    return list(result.scalars().all())


async def create_ticket(db: AsyncSession, project_id: uuid.UUID, payload: TicketCreate, user: User, organization_id: uuid.UUID) -> Ticket:
    project = await load_project(db, project_id)
    employee = await ensure_project_access(db, project, user)
    is_manager = project.manager_id == employee.id

    assigned_to_id = payload.assigned_to_id
    if is_manager:
        _validate_assignee(project, assigned_to_id)
    else:
        if assigned_to_id not in (None, employee.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employees can only self-assign tickets.",
            )
        assigned_to_id = employee.id

    ticket = Ticket(
        id=uuid.uuid4(),
        project_id=project_id,
        parent_ticket_id=payload.parent_ticket_id,
        title=payload.title.strip(),
        description=payload.description,
        priority=await _validate_priority(db, organization_id, payload.priority),
        due_date=payload.due_date,
        assigned_to_id=assigned_to_id,
        created_by_id=user.id,
        approval_status="not_requested" if is_manager else "pending",
    )
    db.add(ticket)
    if not is_manager:
        db.add(TicketLog(
            id=uuid.uuid4(),
            ticket_id=ticket.id,
            note="Ticket submitted for manager approval.",
            status_from=None,
            status_to="approval_pending",
            logged_by_id=user.id,
        ))
    await db.commit()
    await db.refresh(ticket)
    return ticket

async def update_ticket(db: AsyncSession, ticket_id: uuid.UUID, payload: TicketUpdate, user: User, organization_id: uuid.UUID) -> Ticket:
    ticket = await _get_ticket(db, ticket_id)
    project = await load_project(db, ticket.project_id)
    await require_owning_manager(db, project, user)

    update_data = payload.model_dump(exclude_unset=True)
    if "assigned_to_id" in update_data:
        _validate_assignee(project, update_data["assigned_to_id"])
    if update_data.get("priority") is not None:
        update_data["priority"] = await _validate_priority(db, organization_id, update_data["priority"])

    for field, value in update_data.items():
        setattr(ticket, field, value)
    await db.commit()
    await db.refresh(ticket)
    return ticket


async def update_status(db: AsyncSession, ticket_id: uuid.UUID, payload: TicketStatusUpdate, user: User) -> Ticket:
    ticket = await _get_ticket(db, ticket_id)
    project = await load_project(db, ticket.project_id)
    employee = await ensure_project_access(db, project, user)

    is_manager = project.manager_id == employee.id

    # Reopening a cancelled/dropped ticket is a manager-only action,
    # same as cancelling/dropping it in the first place.
    if ticket.status in MANAGER_ONLY_STATUSES and not is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This ticket is cancelled or dropped. Only the project manager can reopen it.",
        )
    if payload.status in MANAGER_ONLY_STATUSES and not is_manager:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the project manager can cancel or drop a ticket.")
    if not is_manager and payload.status not in EMPLOYEE_ALLOWED_STATUSES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot set this status.")
    if not is_manager and ticket.assigned_to_id != employee.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update tickets assigned to you.")

    old_status = ticket.status
    ticket.status = payload.status

    db.add(
        TicketLog(
            id=uuid.uuid4(),
            ticket_id=ticket.id,
            note=payload.note or f"Status changed from {old_status.value} to {payload.status.value}",
            status_from=old_status.value,
            status_to=payload.status.value,
            logged_by_id=user.id,
        )
    )
    await db.commit()
    await db.refresh(ticket)
    return ticket


async def add_log(db: AsyncSession, ticket_id: uuid.UUID, payload: TicketLogAdd, user: User) -> Ticket:
    ticket = await _get_ticket(db, ticket_id)
    project = await load_project(db, ticket.project_id)
    await ensure_project_access(db, project, user)

    db.add(TicketLog(id=uuid.uuid4(), ticket_id=ticket.id, note=payload.note, logged_by_id=user.id))
    await db.commit()
    await db.refresh(ticket)
    return ticket


async def list_logs(db: AsyncSession, ticket_id: uuid.UUID, user: User) -> list[TicketLog]:
    ticket = await _get_ticket(db, ticket_id)
    project = await load_project(db, ticket.project_id)
    await ensure_project_access(db, project, user)
    result = await db.execute(select(TicketLog).where(TicketLog.ticket_id == ticket_id).order_by(TicketLog.created_at.desc()))
    return list(result.scalars().all())


async def set_approval_status(
    db: AsyncSession,
    ticket_id: uuid.UUID,
    payload: TicketApprovalUpdate,
    user: User,
) -> Ticket:
    ticket = await _get_ticket(db, ticket_id)
    project = await load_project(db, ticket.project_id)
    await require_owning_manager(db, project, user)

    previous = ticket.approval_status
    ticket.approval_status = payload.status
    note = payload.note.strip() if payload.note else ""
    message = f"Approval changed from {previous} to {payload.status}."
    if note:
        message = f"{message} Note: {note}"

    db.add(TicketLog(
        id=uuid.uuid4(),
        ticket_id=ticket.id,
        note=message,
        status_from=f"approval:{previous}",
        status_to=f"approval:{payload.status}",
        logged_by_id=user.id,
    ))
    await db.commit()
    await db.refresh(ticket)
    return ticket

