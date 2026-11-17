import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.notification import RequestTicketUpdate
from app.services import project_service
from app.services.employee_service import get_employee_by_user_id


async def list_notifications(
    db: AsyncSession,
    user: User,
) -> list[Notification]:
    result = await db.execute(
        select(Notification)
        .where(Notification.recipient_user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(100)
    )
    return list(result.scalars().all())


async def mark_notification_read(
    db: AsyncSession,
    notification_id: uuid.UUID,
    user: User,
) -> Notification:
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.recipient_user_id == user.id,
        )
    )
    notification = result.scalar_one_or_none()

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )

    if notification.read_at is None:
        notification.read_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(notification)

    return notification


async def mark_all_notifications_read(
    db: AsyncSession,
    user: User,
) -> int:
    result = await db.execute(
        update(Notification)
        .where(
            Notification.recipient_user_id == user.id,
            Notification.read_at.is_(None),
        )
        .values(read_at=datetime.now(timezone.utc))
    )
    await db.commit()
    return result.rowcount or 0


async def request_ticket_update(
    db: AsyncSession,
    ticket_id: uuid.UUID,
    payload: RequestTicketUpdate,
    user: User,
) -> Notification:
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found.",
        )

    project = await project_service.load_project(db, ticket.project_id)
    await project_service.require_owning_manager(db, project, user)

    if ticket.assigned_to_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assign this ticket before requesting an update.",
        )

    employee = await get_employee_by_user_id(db, user_id=uuid.UUID(int=0))
    # Fetch the assignee directly; this avoids relying on a loaded relationship.
    from app.models.employee import Employee

    result = await db.execute(
        select(Employee).where(Employee.id == ticket.assigned_to_id)
    )
    assignee = result.scalar_one_or_none()

    if assignee is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The assigned employee could not be found.",
        )

    message = (payload.message or "").strip()
    if not message:
        message = f"Please post an update for ticket '{ticket.title}'."

    notification = Notification(
        id=uuid.uuid4(),
        recipient_user_id=assignee.user_id,
        kind="update_requested",
        title="Project update requested",
        message=message,
        related_project_id=project.id,
        related_ticket_id=ticket.id,
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification
