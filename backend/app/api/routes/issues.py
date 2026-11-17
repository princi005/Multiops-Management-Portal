import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.permissions import require_role
from app.db.session import get_db
from app.models.employee_issue import IssueStatus
from app.models.user import User
from app.schemas.issue import IssueCreate, IssueForAccountsRead, IssueRead, IssueRespond
from app.services import issue_service

router = APIRouter(tags=["issues"])


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