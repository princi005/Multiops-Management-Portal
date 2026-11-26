import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.permissions import require_role
from app.db.session import get_db
from app.api.tenant import get_current_organization
from app.models.employee_issue import IssueStatus
from app.models.user import User
from app.schemas.issue import IssueCreate, IssueForAccountsRead, IssueRead, IssueRespond
from app.schemas.employee_asset import (
    EmployeeAssetAssign,
    EmployeeAssetRead,
    EmployeeAssetRequestCreate,
    EmployeeAssetRequestForITRead,
    EmployeeAssetRequestRead,
    EmployeeAssetRequestRespond,
)
from app.services import issue_service
from app.services import employee_asset_service

router = APIRouter(tags=["issues"])

def _require_asset_manager(active):
    _organization, membership = active
    if membership.role.casefold() not in {"it", "org_admin"}:
        raise HTTPException(status_code=403, detail="IT or Organization Admin permission required.")


def _require_it_member(active):
    _organization, membership = active
    if membership.role.casefold() != "it":
        raise HTTPException(status_code=403, detail="IT membership is required.")


# ---- the employee's own issues ----

@router.post("/me/issues", response_model=IssueRead, status_code=201)
async def create_issue(
    payload: IssueCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await issue_service.create_issue(db, user, payload)


@router.get("/me/issues", response_model=list[IssueRead])
async def list_my_issues(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await issue_service.list_my_issues(db, user)


@router.post("/me/issues/{issue_id}/withdraw", response_model=IssueRead)
async def withdraw_my_issue(
    issue_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await issue_service.withdraw_my_issue(db, user, issue_id)


@router.get("/me/assets", response_model=list[EmployeeAssetRead])
async def list_my_assets(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    return await employee_asset_service.list_my_assets(db, user, organization.id)


@router.post("/employees/{employee_id}/assets", response_model=EmployeeAssetRead, status_code=201)
async def assign_employee_asset(
    employee_id: uuid.UUID,
    payload: EmployeeAssetAssign,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    _require_asset_manager(active)
    organization, _membership = active
    return await employee_asset_service.assign_asset(
        db, user, organization.id, employee_id, payload
    )


@router.post("/me/assets/requests", response_model=EmployeeAssetRequestRead, status_code=201)
async def create_my_asset_request(
    payload: EmployeeAssetRequestCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    return await employee_asset_service.create_my_asset_request(
        db, user, organization.id, payload
    )


@router.get("/me/assets/requests", response_model=list[EmployeeAssetRequestRead])
async def list_my_asset_requests(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    return await employee_asset_service.list_my_asset_requests(
        db, user, organization.id
    )


@router.get("/it/asset-requests", response_model=list[EmployeeAssetRequestForITRead])
async def list_asset_requests_for_it(
    status_filter: str | None = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
    active=Depends(get_current_organization),
):
    _require_it_member(active)
    organization, _membership = active
    return await employee_asset_service.list_asset_requests_for_it(
        db, organization.id, status_filter
    )


@router.patch("/it/asset-requests/{request_id}", response_model=EmployeeAssetRequestForITRead)
async def respond_to_asset_request(
    request_id: uuid.UUID,
    payload: EmployeeAssetRequestRespond,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    _require_it_member(active)
    organization, _membership = active
    return await employee_asset_service.respond_to_asset_request(
        db, user, organization.id, request_id, payload
    )

# ---- Accounts (the CEO can step in) ----

@router.get("/issues", response_model=list[IssueForAccountsRead])
async def list_issues(
    status_filter: IssueStatus | None = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("Accounts", "CEO")),
):
    return await issue_service.list_issues_for_accounts(db, status_filter)


@router.post("/issues/{issue_id}/respond", response_model=IssueForAccountsRead)
async def respond_to_issue(
    issue_id: uuid.UUID,
    payload: IssueRespond,
    db: AsyncSession = Depends(get_db),
    handler: User = Depends(require_role("Accounts", "CEO")),
):
    return await issue_service.respond_to_issue(db, handler, issue_id, payload)