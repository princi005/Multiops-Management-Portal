import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee import Employee
from app.models.employee_issue import EmployeeAsset, EmployeeAssetRequest
from app.models.organization import OrganizationAdminLog, OrganizationMember
from app.models.user import User
from app.schemas.employee_asset import (
    EmployeeAssetAssign,
    EmployeeAssetRead,
    EmployeeAssetRequestCreate,
    EmployeeAssetRequestForITRead,
    EmployeeAssetRequestRead,
    EmployeeAssetRequestRespond,
)
from app.services.me_service import get_my_employee


def _employee_request_read(request, asset_name: str, device_id: str) -> EmployeeAssetRequestRead:
    return EmployeeAssetRequestRead(
        id=request.id,
        asset_id=request.asset_id,
        asset_name=asset_name,
        device_id=device_id,
        request_type=request.request_type,
        support_team=request.support_team,
        details=request.details,
        status=request.status,
        response=request.response,
        resolved_at=request.resolved_at,
        created_at=request.created_at,
        updated_at=request.updated_at,
    )


async def list_my_assets(
    db: AsyncSession, user: User, organization_id: uuid.UUID
) -> list[EmployeeAssetRead]:
    employee = await get_my_employee(db, user)
    result = await db.execute(
        select(EmployeeAsset)
        .where(
            EmployeeAsset.organization_id == organization_id,
            EmployeeAsset.employee_id == employee.id,
        )
        .order_by(EmployeeAsset.name, EmployeeAsset.device_id)
    )
    return [EmployeeAssetRead.model_validate(asset) for asset in result.scalars().all()]


async def assign_asset(
    db: AsyncSession,
    actor: User,
    organization_id: uuid.UUID,
    employee_id: uuid.UUID,
    payload: EmployeeAssetAssign,
) -> EmployeeAssetRead:
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
        raise HTTPException(status_code=404, detail="Active employee membership not found in this organization.")

    asset = EmployeeAsset(
        id=uuid.uuid4(),
        organization_id=organization_id,
        employee_id=employee.id,
        name=payload.name,
        device_id=payload.device_id,
        status=payload.status,
    )
    db.add(asset)
    db.add(
        OrganizationAdminLog(
            organization_id=organization_id,
            actor_user_id=actor.id,
            action="employee.asset.assigned",
            details={
                "employee_id": str(employee.id),
                "device_id": payload.device_id,
            },
        )
    )
    try:
        await db.commit()
        await db.refresh(asset)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="That device ID is already assigned in this organization.",
        ) from exc

    return EmployeeAssetRead.model_validate(asset)


async def create_my_asset_request(
    db: AsyncSession,
    user: User,
    organization_id: uuid.UUID,
    payload: EmployeeAssetRequestCreate,
) -> EmployeeAssetRequestRead:
    employee = await get_my_employee(db, user)
    asset = await db.scalar(
        select(EmployeeAsset).where(
            EmployeeAsset.id == payload.asset_id,
            EmployeeAsset.organization_id == organization_id,
            EmployeeAsset.employee_id == employee.id,
        )
    )
    if asset is None:
        raise HTTPException(status_code=404, detail="Assigned asset not found.")

    request = EmployeeAssetRequest(
        id=uuid.uuid4(),
        organization_id=organization_id,
        employee_id=employee.id,
        asset_id=asset.id,
        request_type=payload.request_type,
        support_team="IT",
        details=payload.details,
    )
    db.add(request)
    db.add(
        OrganizationAdminLog(
            organization_id=organization_id,
            actor_user_id=user.id,
            action="employee.asset_request.created",
            details={
                "employee_id": str(employee.id),
                "asset_id": str(asset.id),
                "request_id": str(request.id),
            },
        )
    )
    await db.commit()
    await db.refresh(request)
    return _employee_request_read(request, asset.name, asset.device_id)


async def list_my_asset_requests(
    db: AsyncSession, user: User, organization_id: uuid.UUID
) -> list[EmployeeAssetRequestRead]:
    employee = await get_my_employee(db, user)
    result = await db.execute(
        select(EmployeeAssetRequest, EmployeeAsset.name, EmployeeAsset.device_id)
        .join(EmployeeAsset, EmployeeAsset.id == EmployeeAssetRequest.asset_id)
        .where(
            EmployeeAssetRequest.organization_id == organization_id,
            EmployeeAssetRequest.employee_id == employee.id,
        )
        .order_by(EmployeeAssetRequest.created_at.desc())
    )
    return [
        _employee_request_read(request, asset_name, device_id)
        for request, asset_name, device_id in result.all()
    ]


async def list_asset_requests_for_it(
    db: AsyncSession,
    organization_id: uuid.UUID,
    status_filter: str | None = None,
) -> list[EmployeeAssetRequestForITRead]:
    stmt = (
        select(
            EmployeeAssetRequest,
            EmployeeAsset.name,
            EmployeeAsset.device_id,
            Employee.employee_code,
            User.full_name,
            User.email,
        )
        .join(EmployeeAsset, EmployeeAsset.id == EmployeeAssetRequest.asset_id)
        .join(Employee, Employee.id == EmployeeAssetRequest.employee_id)
        .join(User, User.id == Employee.user_id)
        .where(EmployeeAssetRequest.organization_id == organization_id)
    )
    if status_filter is not None:
        stmt = stmt.where(EmployeeAssetRequest.status == status_filter)

    result = await db.execute(stmt.order_by(EmployeeAssetRequest.created_at.desc()).limit(500))
    return [
        EmployeeAssetRequestForITRead(
            **_employee_request_read(request, asset_name, device_id).model_dump(),
            employee_id=request.employee_id,
            employee_code=employee_code,
            employee_name=employee_name,
            employee_email=employee_email,
        )
        for request, asset_name, device_id, employee_code, employee_name, employee_email in result.all()
    ]


async def respond_to_asset_request(
    db: AsyncSession,
    handler: User,
    organization_id: uuid.UUID,
    request_id: uuid.UUID,
    payload: EmployeeAssetRequestRespond,
) -> EmployeeAssetRequestForITRead:
    request = await db.scalar(
        select(EmployeeAssetRequest)
        .where(
            EmployeeAssetRequest.id == request_id,
            EmployeeAssetRequest.organization_id == organization_id,
        )
        .with_for_update()
    )
    if request is None:
        raise HTTPException(status_code=404, detail="Asset request not found.")
    if request.status not in {"open", "in_progress"}:
        raise HTTPException(status_code=409, detail=f"This request is already {request.status}.")

    response_text = payload.response
    if payload.status == "resolved" and not response_text:
        raise HTTPException(
            status_code=422,
            detail="Add a response before resolving the request.",
        )

    request.status = payload.status
    request.response = response_text
    request.handled_by_id = handler.id
    if payload.status == "resolved":
        request.resolved_at = datetime.now(timezone.utc)

    db.add(
        OrganizationAdminLog(
            organization_id=organization_id,
            actor_user_id=handler.id,
            action="employee.asset_request.updated",
            details={
                "request_id": str(request.id),
                "status": request.status,
            },
        )
    )
    await db.commit()

    result = await db.execute(
        select(
            EmployeeAssetRequest,
            EmployeeAsset.name,
            EmployeeAsset.device_id,
            Employee.employee_code,
            User.full_name,
            User.email,
        )
        .join(EmployeeAsset, EmployeeAsset.id == EmployeeAssetRequest.asset_id)
        .join(Employee, Employee.id == EmployeeAssetRequest.employee_id)
        .join(User, User.id == Employee.user_id)
        .where(
            EmployeeAssetRequest.id == request_id,
            EmployeeAssetRequest.organization_id == organization_id,
        )
    )
    row = result.one()
    updated, asset_name, device_id, employee_code, employee_name, employee_email = row
    return EmployeeAssetRequestForITRead(
        **_employee_request_read(updated, asset_name, device_id).model_dump(),
        employee_id=updated.employee_id,
        employee_code=employee_code,
        employee_name=employee_name,
        employee_email=employee_email,
    )