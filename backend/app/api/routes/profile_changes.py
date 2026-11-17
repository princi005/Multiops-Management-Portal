import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.permissions import require_role
from app.db.session import get_db
from app.models.profile_change_request import ChangeStatus
from app.models.user import User
from app.schemas.profile_change import (
    ChangeDecision,
    ChangeRequestCreate,
    ChangeRequestHRRead,
    ChangeRequestRead,
)
from app.services import profile_change_service

router = APIRouter(tags=["profile-changes"])


# ---- the employee's own requests ----

@router.post("/me/change-requests", response_model=ChangeRequestRead, status_code=201)
async def submit_change_request(
    payload: ChangeRequestCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await profile_change_service.submit_change_request(db, user, payload)


@router.get("/me/change-requests", response_model=list[ChangeRequestRead])
async def list_my_change_requests(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await profile_change_service.list_my_requests(db, user)


@router.post("/me/change-requests/{request_id}/cancel", response_model=ChangeRequestRead)
async def cancel_my_change_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await profile_change_service.cancel_my_request(db, user, request_id)


# ---- HR (the CEO can step in) ----

@router.get("/change-requests", response_model=list[ChangeRequestHRRead])
async def list_change_requests(
    status_filter: ChangeStatus | None = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("HR", "CEO")),
):
    return await profile_change_service.list_requests_for_hr(db, status_filter)


@router.post("/change-requests/{request_id}/approve", response_model=ChangeRequestHRRead)
async def approve_change_request(
    request_id: uuid.UUID,
    payload: ChangeDecision | None = None,
    db: AsyncSession = Depends(get_db),
    decider: User = Depends(require_role("HR", "CEO")),
):
    note = payload.decision_note if payload else None
    return await profile_change_service.decide_request(db, decider, request_id, True, note)


@router.post("/change-requests/{request_id}/reject", response_model=ChangeRequestHRRead)
async def reject_change_request(
    request_id: uuid.UUID,
    payload: ChangeDecision | None = None,
    db: AsyncSession = Depends(get_db),
    decider: User = Depends(require_role("HR", "CEO")),
):
    note = payload.decision_note if payload else None
    return await profile_change_service.decide_request(db, decider, request_id, False, note)