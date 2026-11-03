import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.employee_request import (
    EmployeeRequestApproval,
    EmployeeRequestCreate,
    EmployeeRequestDecision,
    EmployeeRequestRead,
)
from app.services import employee_request_service

router = APIRouter(prefix="/employee-requests", tags=["employee-requests"])


@router.get("", response_model=list[EmployeeRequestRead])
async def list_requests(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("HR", "Accounts", "CEO")),
):
    return await employee_request_service.list_requests(db)


@router.post("", response_model=EmployeeRequestRead, status_code=201)
async def create_request(
    payload: EmployeeRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("HR")),
):
    return await employee_request_service.create_request(db, payload, current_user)


@router.post("/{request_id}/approve", response_model=EmployeeRequestApproval)
async def approve_request(
    request_id: uuid.UUID,
    payload: EmployeeRequestDecision,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("Accounts")),
):
    return await employee_request_service.approve_request(db, request_id, payload, current_user)


@router.post("/{request_id}/reject", response_model=EmployeeRequestRead)
async def reject_request(
    request_id: uuid.UUID,
    payload: EmployeeRequestDecision,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("Accounts")),
):
    return await employee_request_service.reject_request(db, request_id, payload, current_user)