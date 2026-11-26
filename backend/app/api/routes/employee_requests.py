import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.organization_roles import require_org_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.employee_request import (
    EmployeeRequestApproval,
    EmployeeRequestCreate,
    EmployeeRequestDecision,
    EmployeeRequestRead,
)
from app.services import organization_employee_request_service

router = APIRouter(prefix="/employee-requests", tags=["employee-requests"])


@router.get("", response_model=list[EmployeeRequestRead])
async def list_requests(
    db: AsyncSession = Depends(get_db),
    active=Depends(require_org_role("HR", "Accounts", "CEO")),
):
    organization, _membership = active
    return await organization_employee_request_service.list_requests(db, organization.id)


@router.post("", response_model=EmployeeRequestRead, status_code=201)
async def create_request(
    payload: EmployeeRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    active=Depends(require_org_role("HR")),
):
    organization, _membership = active
    return await organization_employee_request_service.create_request(db, payload, current_user, organization.id)


@router.post("/{request_id}/approve", response_model=EmployeeRequestApproval)
async def approve_request(
    request_id: uuid.UUID,
    payload: EmployeeRequestDecision,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    active=Depends(require_org_role("Accounts", "CEO")),
):
    organization, _membership = active
    return await organization_employee_request_service.approve_request(db, request_id, payload, current_user, organization.id)


@router.post("/{request_id}/reject", response_model=EmployeeRequestRead)
async def reject_request(
    request_id: uuid.UUID,
    payload: EmployeeRequestDecision,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    active=Depends(require_org_role("Accounts", "CEO")),
):
    organization, _membership = active
    return await organization_employee_request_service.reject_request(db, request_id, payload, current_user, organization.id)