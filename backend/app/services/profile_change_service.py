"""
Profile change requests: an employee describes something to change in their
profile, HR (or the CEO) decides.

- "general" requests are free text. Approving one applies nothing: HR makes
  the change by hand and marks the request done. Several can be pending at
  once (up to MAX_PENDING_GENERAL).
- "full_name" / "phone" requests (API only) are applied automatically when
  approved, and only one can be pending per field.

- Employees only ever touch their own requests (found via their user id).
- A decision locks the row first, so two people cannot decide the same
  request at once, and only a PENDING request can be decided.
- Nobody can decide their own request.
- Approving applies the change in the same transaction as the status update.
- The request row itself (who, when, old value, new value, note) is the audit trail.
"""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee import Employee
from app.models.profile_change_request import ChangeField, ChangeStatus, ProfileChangeRequest
from app.models.user import User
from app.schemas.profile_change import ChangeRequestCreate, ChangeRequestHRRead, ChangeRequestRead
from app.services.me_service import get_my_employee
from app.services.profile_change_rules import MAX_PENDING_GENERAL, ChangeValueError, normalize_value

_LABELS = {ChangeField.FULL_NAME: "name", ChangeField.PHONE: "phone number", ChangeField.GENERAL: "details"}


def _to_hr_read(
    request: ProfileChangeRequest, employee_code: str, employee_name: str | None, employee_email: str
) -> ChangeRequestHRRead:
    return ChangeRequestHRRead(
        **ChangeRequestRead.model_validate(request).model_dump(),
        employee_id=request.employee_id,
        organization_id=request.organization_id,
        employee_code=employee_code,
        employee_name=employee_name,
        employee_email=employee_email,
    )


def _hr_select():
    return (
        select(ProfileChangeRequest, Employee.employee_code, User.full_name, User.email)
        .join(Employee, Employee.id == ProfileChangeRequest.employee_id)
        .join(User, User.id == Employee.user_id)
    )


async def submit_change_request(
    db: AsyncSession, user: User, payload: ChangeRequestCreate, organization_id: uuid.UUID
) -> ProfileChangeRequest:
    employee = await get_my_employee(db, user)

    try:
        new_value = normalize_value(payload.field.value, payload.new_value)
    except ChangeValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    label = _LABELS[payload.field]
    if payload.field == ChangeField.GENERAL:
        current = None
        pending_general = await db.scalar(
            select(func.count())
            .select_from(ProfileChangeRequest)
            .where(
                ProfileChangeRequest.employee_id == employee.id,
                ProfileChangeRequest.organization_id == organization_id,
                ProfileChangeRequest.field == ChangeField.GENERAL,
                ProfileChangeRequest.status == ChangeStatus.PENDING,
            )
        )
        if (pending_general or 0) >= MAX_PENDING_GENERAL:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You already have {MAX_PENDING_GENERAL} requests waiting for HR. Cancel one or wait for a decision.",
            )
    else:
        current = user.full_name if payload.field == ChangeField.FULL_NAME else employee.phone
        if (current or "") == new_value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=f"That is already your current {label}."
            )

        pending = await db.execute(
            select(ProfileChangeRequest.id).where(
                ProfileChangeRequest.employee_id == employee.id,
                ProfileChangeRequest.organization_id == organization_id,
                ProfileChangeRequest.field == payload.field,
                ProfileChangeRequest.status == ChangeStatus.PENDING,
            )
        )
        if pending.first() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"You already have a pending request to change your {label}. Cancel it first to send a new one.",
            )

    request = ProfileChangeRequest(
        id=uuid.uuid4(),
        organization_id=organization_id,
        employee_id=employee.id,
        field=payload.field,
        old_value=current,
        new_value=new_value,
        reason=payload.reason,
    )
    db.add(request)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"You already have a pending request to change your {label}.",
        )
    await db.refresh(request)
    return request


async def list_my_requests(db: AsyncSession, user: User, organization_id: uuid.UUID) -> list[ProfileChangeRequest]:
    employee = await get_my_employee(db, user)
    result = await db.execute(
        select(ProfileChangeRequest)
        .where(ProfileChangeRequest.employee_id == employee.id, ProfileChangeRequest.organization_id == organization_id)
        .order_by(ProfileChangeRequest.created_at.desc())
    )
    return list(result.scalars().all())


async def cancel_my_request(db: AsyncSession, user: User, organization_id: uuid.UUID, request_id: uuid.UUID) -> ProfileChangeRequest:
    employee = await get_my_employee(db, user)
    result = await db.execute(
        select(ProfileChangeRequest)
        .where(ProfileChangeRequest.id == request_id, ProfileChangeRequest.employee_id == employee.id, ProfileChangeRequest.organization_id == organization_id)
        .with_for_update()
    )
    request = result.scalar_one_or_none()
    if request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")
    if request.status != ChangeStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=f"This request is already {request.status.value}."
        )
    request.status = ChangeStatus.CANCELLED
    await db.commit()
    await db.refresh(request)
    return request


async def list_requests_for_hr(
    db: AsyncSession, organization_id: uuid.UUID, status_filter: ChangeStatus | None
) -> list[ChangeRequestHRRead]:
    stmt = _hr_select().where(ProfileChangeRequest.organization_id == organization_id)
    if status_filter is not None:
        stmt = stmt.where(ProfileChangeRequest.status == status_filter)
    # Pending first (they need action), then newest first.
    stmt = stmt.order_by(
        case((ProfileChangeRequest.status == ChangeStatus.PENDING, 0), else_=1),
        ProfileChangeRequest.created_at.desc(),
    ).limit(500)
    result = await db.execute(stmt)
    return [_to_hr_read(*row) for row in result.all()]


async def _get_hr_request(db: AsyncSession, request_id: uuid.UUID, organization_id: uuid.UUID) -> ChangeRequestHRRead:
    result = await db.execute(_hr_select().where(ProfileChangeRequest.id == request_id, ProfileChangeRequest.organization_id == organization_id))
    row = result.first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")
    return _to_hr_read(*row)


async def decide_request(
    db: AsyncSession, decider: User, organization_id: uuid.UUID, request_id: uuid.UUID, approve: bool, note: str | None
) -> ChangeRequestHRRead:
    note = (note or "").strip() or None
    if not approve and note is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please give a reason when rejecting a request.",
        )

    result = await db.execute(
        select(ProfileChangeRequest).where(ProfileChangeRequest.id == request_id, ProfileChangeRequest.organization_id == organization_id).with_for_update()
    )
    request = result.scalar_one_or_none()
    if request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")
    if request.status != ChangeStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=f"This request is already {request.status.value}."
        )

    employee_result = await db.execute(select(Employee).where(Employee.id == request.employee_id))
    employee = employee_result.scalar_one_or_none()
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")
    if employee.user_id == decider.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot decide your own request. Another HR user or the CEO needs to do it.",
        )

    if approve:
        if request.field == ChangeField.FULL_NAME:
            owner_result = await db.execute(select(User).where(User.id == employee.user_id))
            owner = owner_result.scalar_one()
            owner.full_name = request.new_value
        elif request.field == ChangeField.PHONE:
            employee.phone = request.new_value
        # GENERAL: nothing is applied automatically - HR makes the change by hand.
        request.status = ChangeStatus.APPROVED
    else:
        request.status = ChangeStatus.REJECTED

    request.decided_by_id = decider.id
    request.decision_note = note
    request.decided_at = datetime.now(timezone.utc)
    await db.commit()

    return await _get_hr_request(db, request_id, organization_id)