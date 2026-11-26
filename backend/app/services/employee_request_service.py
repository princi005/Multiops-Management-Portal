"""
Approval workflow. HR submits requests (pending). Accounts approves
(triggers the real onboarding/exit action, and for creation requests,
sets up the employee's payroll profile) or rejects (status change only).

Duplicate guards:
  - A new hire's email/employee code must be unique (checked at both
    submission and approval, since time can pass between the two).
  - An employee can have at most one PENDING exit request at a time.
  - An employee who has already exited cannot have another exit approved.

Security notes:
  - Request payloads are re-validated and stored in normalized form, so
    stray fields (e.g. a password) are dropped rather than persisted.
  - The temporary password for a new hire is generated here at approval,
    returned once to the approver, and never stored.

Payroll:
  - HR may propose a starting salary in the creation request. Accounts
    has final say and can override it (and set bank/PAN/allowances/
    deductions/benefits) at approval time. A payroll profile is created
    only on approval, alongside the employee record - see
    payroll_service.create_payroll_profile. This never posts a journal
    entry; it is master/configuration data only.
"""

import secrets
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee import Employee, EmploymentStatus
from app.models.employee_request import EmployeeRequest, RequestStatus, RequestType
from app.models.user import User
from app.schemas.employee import EmployeeOnboardRequest
from app.schemas.employee_request import (
    CreationRequestPayload,
    EmployeeRequestApproval,
    EmployeeRequestCreate,
    EmployeeRequestDecision,
    ExitRequestPayload,
)
from app.schemas.payroll import PayrollProfileInput
from app.services import employee_service, payroll_service


async def list_requests(db: AsyncSession) -> list[EmployeeRequest]:
    result = await db.execute(select(EmployeeRequest).order_by(EmployeeRequest.created_at.desc()))
    return list(result.scalars().all())


async def _ensure_new_hire_is_unique(db: AsyncSession, creation: CreationRequestPayload) -> None:
    result = await db.execute(select(User).where(User.email == creation.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A user with this email already exists.")

    result = await db.execute(select(Employee).where(Employee.employee_code == creation.employee_code))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Employee code '{creation.employee_code}' is already in use.",
        )


async def _ensure_no_pending_exit(db: AsyncSession, employee_id: uuid.UUID) -> None:
    result = await db.execute(
        select(EmployeeRequest).where(
            EmployeeRequest.request_type == RequestType.EXIT,
            EmployeeRequest.status == RequestStatus.PENDING,
            EmployeeRequest.payload["employee_id"].astext == str(employee_id),
        )
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An exit request for this employee is already pending.",
        )


async def _ensure_employee_not_already_exited(db: AsyncSession, employee_id: uuid.UUID) -> None:
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if employee is not None and employee.employment_status in (
        EmploymentStatus.INACTIVE,
        EmploymentStatus.TERMINATED,
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This employee has already exited.")


async def create_request(
    db: AsyncSession, payload: EmployeeRequestCreate, requested_by: User, organization_id: uuid.UUID | None = None
) -> EmployeeRequest:
    try:
        if payload.request_type == RequestType.CREATION:
            creation = CreationRequestPayload(**payload.payload)
            await _ensure_new_hire_is_unique(db, creation)
            clean_payload = creation.model_dump(mode="json")
        else:
            exit_request = ExitRequestPayload(**payload.payload)
            employee = await employee_service.get_employee(db, exit_request.employee_id)
            await _ensure_no_pending_exit(db, exit_request.employee_id)
            await _ensure_employee_not_already_exited(db, exit_request.employee_id)
            exit_request.employee_code = employee.employee_code
            clean_payload = exit_request.model_dump(mode="json")
    except ValidationError as exc:
        details = "; ".join(f"{'.'.join(str(p) for p in e['loc'])}: {e['msg']}" for e in exc.errors())
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Invalid request details: {details}"
        ) from exc

    request = EmployeeRequest(
        id=uuid.uuid4(),
        organization_id=organization_id,
        request_type=payload.request_type,
        payload=clean_payload,
        requested_by_id=requested_by.id,
    )
    db.add(request)
    await db.commit()
    await db.refresh(request)
    return request


async def _get_pending_request(db: AsyncSession, request_id: uuid.UUID) -> EmployeeRequest:
    result = await db.execute(select(EmployeeRequest).where(EmployeeRequest.id == request_id))
    request = result.scalar_one_or_none()
    if request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")
    if request.status != RequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Request has already been {request.status.value}."
        )
    return request


async def approve_request(
    db: AsyncSession, request_id: uuid.UUID, payload: EmployeeRequestDecision, decided_by: User
) -> EmployeeRequestApproval:
    request = await _get_pending_request(db, request_id)
    temporary_password: str | None = None

    if request.request_type == RequestType.CREATION:
        data = {k: v for k, v in request.payload.items() if k != "temporary_password"}
        creation = CreationRequestPayload(**data)
        await _ensure_new_hire_is_unique(db, creation)

        basic_salary = payload.basic_salary or creation.proposed_basic_salary
        if basic_salary is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A basic salary is required to approve this request.",
            )

        temporary_password = secrets.token_urlsafe(12)
        new_employee = await employee_service.onboard_employee(
            db,
            EmployeeOnboardRequest(
                **creation.model_dump(exclude={"proposed_basic_salary"}),
                temporary_password=temporary_password,
            ),
        )

        payroll_input = PayrollProfileInput(
            basic_salary=basic_salary,
            allowances=payload.allowances,
            deductions=payload.deductions,
            benefits=payload.benefits,
            pan=payload.pan,
            bank_account_number=payload.bank_account_number,
            ifsc=payload.ifsc,
            effective_date=payload.effective_date,
        )
        await payroll_service.create_payroll_profile(db, new_employee.id, payroll_input, decided_by)

    elif request.request_type == RequestType.EXIT:
        exit_payload = ExitRequestPayload(**request.payload)
        await _ensure_employee_not_already_exited(db, exit_payload.employee_id)
        await employee_service.deactivate_employee(db, exit_payload.employee_id)

    request.status = RequestStatus.APPROVED
    request.decided_by_id = decided_by.id
    request.decision_note = payload.decision_note
    request.decided_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(request)

    result = EmployeeRequestApproval.model_validate(request)
    result.temporary_password = temporary_password
    return result


async def reject_request(
    db: AsyncSession, request_id: uuid.UUID, payload: EmployeeRequestDecision, decided_by: User
) -> EmployeeRequest:
    request = await _get_pending_request(db, request_id)

    request.status = RequestStatus.REJECTED
    request.decided_by_id = decided_by.id
    request.decision_note = payload.decision_note
    request.decided_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(request)
    return request