"""
Employee issues: an employee raises a salary/payslip/attendance (or other)
issue, Accounts (or the CEO) responds and resolves it.

- Employees only ever touch their own issues (found via their user id).
- An employee can have at most MAX_OPEN_ISSUES open or in-progress issues.
- Responding locks the row first, so two people cannot handle the same issue
  at once, and only open / in-progress issues can be responded to.
- Nobody can respond to their own issue.
- The issue row itself (who handled it, when, the response) is the audit trail.
"""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee import Employee
from app.models.employee_issue import EmployeeIssue, IssueStatus
from app.models.user import User
from app.schemas.issue import IssueCreate, IssueForAccountsRead, IssueRead, IssueRespond
from app.services.issue_rules import (
    MAX_OPEN_ISSUES,
    IssueValueError,
    can_respond,
    can_withdraw,
    clean_description,
    clean_response,
    clean_subject,
)
from app.services.me_service import get_my_employee

_OPEN_STATES = (IssueStatus.OPEN, IssueStatus.IN_PROGRESS)


def _to_accounts_read(
    issue: EmployeeIssue, employee_code: str, employee_name: str | None, employee_email: str
) -> IssueForAccountsRead:
    return IssueForAccountsRead(
        **IssueRead.model_validate(issue).model_dump(),
        employee_id=issue.employee_id,
        employee_code=employee_code,
        employee_name=employee_name,
        employee_email=employee_email,
    )


def _accounts_select():
    return (
        select(EmployeeIssue, Employee.employee_code, User.full_name, User.email)
        .join(Employee, Employee.id == EmployeeIssue.employee_id)
        .join(User, User.id == Employee.user_id)
    )


async def create_issue(db: AsyncSession, user: User, payload: IssueCreate) -> EmployeeIssue:
    employee = await get_my_employee(db, user)

    try:
        subject = clean_subject(payload.subject)
        description = clean_description(payload.description)
    except IssueValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    open_count = await db.scalar(
        select(func.count())
        .select_from(EmployeeIssue)
        .where(EmployeeIssue.employee_id == employee.id, EmployeeIssue.status.in_(_OPEN_STATES))
    )
    if (open_count or 0) >= MAX_OPEN_ISSUES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have {MAX_OPEN_ISSUES} open issues. Wait for some to be resolved, or withdraw one.",
        )

    issue = EmployeeIssue(
        id=uuid.uuid4(),
        employee_id=employee.id,
        category=payload.category,
        subject=subject,
        description=description,
    )
    db.add(issue)
    await db.commit()
    await db.refresh(issue)
    return issue


async def list_my_issues(db: AsyncSession, user: User) -> list[EmployeeIssue]:
    employee = await get_my_employee(db, user)
    result = await db.execute(
        select(EmployeeIssue)
        .where(EmployeeIssue.employee_id == employee.id)
        .order_by(EmployeeIssue.created_at.desc())
    )
    return list(result.scalars().all())


async def withdraw_my_issue(db: AsyncSession, user: User, issue_id: uuid.UUID) -> EmployeeIssue:
    employee = await get_my_employee(db, user)
    result = await db.execute(
        select(EmployeeIssue)
        .where(EmployeeIssue.id == issue_id, EmployeeIssue.employee_id == employee.id)
        .with_for_update()
    )
    issue = result.scalar_one_or_none()
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    if not can_withdraw(issue.status.value):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=f"This issue is already {issue.status.value}."
        )
    issue.status = IssueStatus.WITHDRAWN
    await db.commit()
    await db.refresh(issue)
    return issue


async def list_issues_for_accounts(
    db: AsyncSession, status_filter: IssueStatus | None
) -> list[IssueForAccountsRead]:
    stmt = _accounts_select()
    if status_filter is not None:
        stmt = stmt.where(EmployeeIssue.status == status_filter)
    # Open first, then in progress, then everything else; newest first within each.
    stmt = stmt.order_by(
        case(
            (EmployeeIssue.status == IssueStatus.OPEN, 0),
            (EmployeeIssue.status == IssueStatus.IN_PROGRESS, 1),
            else_=2,
        ),
        EmployeeIssue.created_at.desc(),
    ).limit(500)
    result = await db.execute(stmt)
    return [_to_accounts_read(*row) for row in result.all()]


async def _get_accounts_issue(db: AsyncSession, issue_id: uuid.UUID) -> IssueForAccountsRead:
    result = await db.execute(_accounts_select().where(EmployeeIssue.id == issue_id))
    row = result.first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    return _to_accounts_read(*row)


async def respond_to_issue(
    db: AsyncSession, handler: User, issue_id: uuid.UUID, payload: IssueRespond
) -> IssueForAccountsRead:
    target = IssueStatus(payload.status)

    response_text: str | None = None
    if payload.response is not None and payload.response.strip():
        try:
            response_text = clean_response(payload.response)
        except IssueValueError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    if target == IssueStatus.RESOLVED and response_text is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please write a response before resolving an issue.",
        )

    result = await db.execute(select(EmployeeIssue).where(EmployeeIssue.id == issue_id).with_for_update())
    issue = result.scalar_one_or_none()
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    if not can_respond(issue.status.value, target.value):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This issue is {issue.status.value} and cannot be moved to {target.value}.",
        )

    employee_result = await db.execute(select(Employee).where(Employee.id == issue.employee_id))
    employee = employee_result.scalar_one_or_none()
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")
    if employee.user_id == handler.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot respond to your own issue. Another Accounts user or the CEO needs to do it.",
        )

    issue.status = target
    if response_text is not None:
        issue.response = response_text
    issue.handled_by_id = handler.id
    if target == IssueStatus.RESOLVED:
        issue.resolved_at = datetime.now(timezone.utc)
    await db.commit()

    return await _get_accounts_issue(db, issue_id)