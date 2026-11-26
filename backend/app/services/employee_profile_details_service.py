from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee_profile_details import EmployeeProfileDetails
from app.models.organization import OrganizationAdminLog
from app.models.user import User
from app.schemas.me import MyPersonalDetailsRead, MyPersonalDetailsUpdate
from app.services.me_service import get_my_employee


async def get_my_personal_details(
    db: AsyncSession,
    user: User,
    organization_id,
) -> MyPersonalDetailsRead:
    employee = await get_my_employee(db, user)
    result = await db.execute(
        select(EmployeeProfileDetails).where(
            EmployeeProfileDetails.organization_id == organization_id,
            EmployeeProfileDetails.employee_id == employee.id,
        )
    )
    details = result.scalar_one_or_none()

    if details is not None:
        return MyPersonalDetailsRead.model_validate(details)

    return MyPersonalDetailsRead(
        employee_id=employee.id,
        organization_id=organization_id,
    )


async def update_my_personal_details(
    db: AsyncSession,
    user: User,
    organization_id,
    payload: MyPersonalDetailsUpdate,
) -> MyPersonalDetailsRead:
    employee = await get_my_employee(db, user)
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="Provide at least one profile field to update.")

    result = await db.execute(
        select(EmployeeProfileDetails).where(
            EmployeeProfileDetails.organization_id == organization_id,
            EmployeeProfileDetails.employee_id == employee.id,
        )
    )
    details = result.scalar_one_or_none()

    if details is None:
        details = EmployeeProfileDetails(
            organization_id=organization_id,
            employee_id=employee.id,
        )
        db.add(details)

    for field, value in changes.items():
        setattr(details, field, value)

    db.add(
        OrganizationAdminLog(
            organization_id=organization_id,
            actor_user_id=user.id,
            action="employee.personal_details.updated",
            details={
                "employee_id": str(employee.id),
                "changed_fields": sorted(changes.keys()),
            },
        )
    )

    try:
        await db.commit()
        await db.refresh(details)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Profile details changed at the same time. Reload and try again.",
        ) from exc

    return MyPersonalDetailsRead.model_validate(details)