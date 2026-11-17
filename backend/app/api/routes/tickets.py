import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.permissions import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.notification import NotificationRead, RequestTicketUpdate
from app.schemas.ticket import (
    TicketCreate,
    TicketLogAdd,
    TicketLogRead,
    TicketRead,
    TicketStatusUpdate,
    TicketUpdate,
)
from app.services import notification_service, ticket_service

router = APIRouter(tags=["tickets"])


@router.get("/projects/{project_id}/tickets", response_model=list[TicketRead])
async def list_tickets(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await ticket_service.list_tickets(db, project_id, user)


@router.post("/projects/{project_id}/tickets", response_model=TicketRead, status_code=201)
async def create_ticket(
    project_id: uuid.UUID,
    payload: TicketCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("Manager")),
):
    return await ticket_service.create_ticket(db, project_id, payload, user)


@router.patch("/tickets/{ticket_id}", response_model=TicketRead)
async def update_ticket(
    ticket_id: uuid.UUID,
    payload: TicketUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("Manager")),
):
    return await ticket_service.update_ticket(db, ticket_id, payload, user)


@router.post(
    "/tickets/{ticket_id}/request-update",
    response_model=NotificationRead,
    status_code=201,
)
async def request_ticket_update(
    ticket_id: uuid.UUID,
    payload: RequestTicketUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("Manager")),
):
    return await notification_service.request_ticket_update(db, ticket_id, payload, user)


@router.patch("/tickets/{ticket_id}/status", response_model=TicketRead)
async def update_status(
    ticket_id: uuid.UUID,
    payload: TicketStatusUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await ticket_service.update_status(db, ticket_id, payload, user)


@router.get("/tickets/{ticket_id}/logs", response_model=list[TicketLogRead])
async def list_logs(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await ticket_service.list_logs(db, ticket_id, user)


@router.post("/tickets/{ticket_id}/logs", response_model=TicketRead)
async def add_log(
    ticket_id: uuid.UUID,
    payload: TicketLogAdd,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await ticket_service.add_log(db, ticket_id, payload, user)
