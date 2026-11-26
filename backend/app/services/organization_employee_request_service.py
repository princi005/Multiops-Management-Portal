import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee import Employee
from app.models.department import Department
from app.models.employee_request import EmployeeRequest, RequestStatus, RequestType
from app.models.organization import OrganizationAdminLog, OrganizationMember
from app.models.user import User
from app.schemas.employee_request import EmployeeRequestCreate, EmployeeRequestDecision
from app.schemas.employee_request import EmployeeRequestApproval
from app.services import employee_request_service


async def list_requests(db: AsyncSession, organization_id: uuid.UUID) -> list[EmployeeRequest]:
    result = await db.execute(
        select(EmployeeRequest)
        .where(EmployeeRequest.organization_id == organization_id)
        .order_by(EmployeeRequest.created_at.desc())
    )
    return list(result.scalars().all())


async def create_request(
    db: AsyncSession,
    payload: EmployeeRequestCreate,
    requested_by: User,
    organization_id: uuid.UUID,
) -> EmployeeRequest:
    if payload.request_type == RequestType.CREATION:
        department_value = payload.payload.get("department_id")
        if department_value:
            try:
                department_id = uuid.UUID(str(department_value))
            except (TypeError, ValueError) as exc:
                raise HTTPException(status_code=422, detail="A valid department_id is required.") from exc

            department = await db.scalar(
                select(Department).where(
                    Department.id == department_id,
                    Department.organization_id == organization_id,
                )
            )
            if department is None:
                raise HTTPException(status_code=422, detail="Choose a department from this organization.")
    if payload.request_type == RequestType.EXIT:
        try:
            employee_id = uuid.UUID(str(payload.payload.get("employee_id")))
        except (TypeError, ValueError) as exc:
            raise HTTPException(status_code=422, detail="A valid employee_id is required.") from exc

        employee = await db.scalar(
            select(Employee)
            .join(OrganizationMember, OrganizationMember.user_id == Employee.user_id)
            .where(
                Employee.id == employee_id,
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.is_active.is_(True),
            )
        )
        if employee is None:
            raise HTTPException(status_code=404, detail="Employee not found in this organization.")

    request = await employee_request_service.create_request(db, payload, requested_by, organization_id)
    request.organization_id = organization_id
    db.add(request)
    db.add(
        OrganizationAdminLog(
            organization_id=organization_id,
            actor_user_id=requested_by.id,
            action="employee.request.created",
            details={"request_id": str(request.id), "request_type": request.request_type.value},
        )
    )
    await db.commit()
    await db.refresh(request)
    return request


async def _get_pending_request(
    db: AsyncSession, request_id: uuid.UUID, organization_id: uuid.UUID
) -> EmployeeRequest:
    request = await db.scalar(
        select(EmployeeRequest).where(
            EmployeeRequest.id == request_id,
            EmployeeRequest.organization_id == organization_id,
            EmployeeRequest.status == RequestStatus.PENDING,
        )
    )
    if request is None:
        raise HTTPException(status_code=404, detail="Pending request not found in this organization.")
    return request


async def approve_request(
    db: AsyncSession,
    request_id: uuid.UUID,
    payload: EmployeeRequestDecision,
    decided_by: User,
    organization_id: uuid.UUID,
) -> EmployeeRequestApproval:
    request = await _get_pending_request(db, request_id, organization_id)
    request_type = request.request_type
    request_payload = dict(request.payload)

    result = await employee_request_service.approve_request(db, request_id, payload, decided_by)

    if request_type == RequestType.CREATION:
        email = str(request_payload.get("email", "")).casefold()
        new_user = await db.scalar(select(User).where(User.email == email))
        if new_user is None:
            raise HTTPException(status_code=409, detail="Approved employee account was not found.")

        existing_membership = await db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.user_id == new_user.id,
            )
        )
        if existing_membership is None:
            db.add(
                OrganizationMember(
                    organization_id=organization_id,
                    user_id=new_user.id,
                    role="employee",
                    is_active=True,
                )
            )
    else:
        try:
            employee_id = uuid.UUID(str(request_payload.get("employee_id")))
        except (TypeError, ValueError) as exc:
            raise HTTPException(status_code=409, detail="The exit request has an invalid employee ID.") from exc

        employee = await db.scalar(select(Employee).where(Employee.id == employee_id))
        if employee is not None:
            membership = await db.scalar(
                select(OrganizationMember).where(
                    OrganizationMember.organization_id == organization_id,
                    OrganizationMember.user_id == employee.user_id,
                )
            )
            if membership is not None:
                membership.is_active = False

            remaining_memberships = await db.scalar(
                select(OrganizationMember.id).where(
                    OrganizationMember.user_id == employee.user_id,
                    OrganizationMember.is_active.is_(True),
                ).limit(1)
            )
            if remaining_memberships is not None:
                user = await db.get(User, employee.user_id)
                if user is not None:
                    user.is_active = True

    db.add(
        OrganizationAdminLog(
            organization_id=organization_id,
            actor_user_id=decided_by.id,
            action="employee.request.approved",
            details={"request_id": str(request_id), "request_type": request_type.value},
        )
    )
    await db.commit()
    return result


async def reject_request(
    db: AsyncSession,
    request_id: uuid.UUID,
    payload: EmployeeRequestDecision,
    decided_by: User,
    organization_id: uuid.UUID,
) -> EmployeeRequest:
    await _get_pending_request(db, request_id, organization_id)
    request = await employee_request_service.reject_request(db, request_id, payload, decided_by)
    request.organization_id = organization_id
    db.add(
        OrganizationAdminLog(
            organization_id=organization_id,
            actor_user_id=decided_by.id,
            action="employee.request.rejected",
            details={"request_id": str(request_id)},
        )
    )
    await db.commit()
    await db.refresh(request)
    return request