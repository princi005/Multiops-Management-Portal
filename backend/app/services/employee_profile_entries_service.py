import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee_profile_details import EmployeeCourse, EmployeeExperience
from app.models.organization import OrganizationAdminLog
from app.models.user import User
from app.schemas.me import (
    ProfileCourseCreate,
    ProfileCourseRead,
    ProfileCourseUpdate,
    ProfileExperienceCreate,
    ProfileExperienceRead,
    ProfileExperienceUpdate,
)
from app.services.me_service import get_my_employee


async def list_experiences(db: AsyncSession, user: User, organization_id: uuid.UUID):
    employee = await get_my_employee(db, user)
    result = await db.execute(
        select(EmployeeExperience)
        .where(
            EmployeeExperience.organization_id == organization_id,
            EmployeeExperience.employee_id == employee.id,
        )
        .order_by(EmployeeExperience.created_at, EmployeeExperience.id)
    )
    return result.scalars().all()


async def create_experience(
    db: AsyncSession,
    user: User,
    organization_id: uuid.UUID,
    payload: ProfileExperienceCreate,
) -> ProfileExperienceRead:
    employee = await get_my_employee(db, user)
    entry = EmployeeExperience(
        id=uuid.uuid4(),
        organization_id=organization_id,
        employee_id=employee.id,
        **payload.model_dump(),
    )
    db.add(entry)
    db.add(
        OrganizationAdminLog(
            organization_id=organization_id,
            actor_user_id=user.id,
            action="employee.experience.created",
            details={"employee_id": str(employee.id), "entry_id": str(entry.id)},
        )
    )
    await db.commit()
    await db.refresh(entry)
    return ProfileExperienceRead.model_validate(entry)


async def update_experience(
    db: AsyncSession,
    user: User,
    organization_id: uuid.UUID,
    entry_id: uuid.UUID,
    payload: ProfileExperienceUpdate,
) -> ProfileExperienceRead:
    employee = await get_my_employee(db, user)
    entry = await db.scalar(
        select(EmployeeExperience).where(
            EmployeeExperience.id == entry_id,
            EmployeeExperience.organization_id == organization_id,
            EmployeeExperience.employee_id == employee.id,
        )
    )
    if entry is None:
        raise HTTPException(status_code=404, detail="Experience entry not found.")

    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="Provide at least one experience field to update.")

    for field, value in changes.items():
        setattr(entry, field, value)

    db.add(
        OrganizationAdminLog(
            organization_id=organization_id,
            actor_user_id=user.id,
            action="employee.experience.updated",
            details={
                "employee_id": str(employee.id),
                "entry_id": str(entry.id),
                "changed_fields": sorted(changes.keys()),
            },
        )
    )
    await db.commit()
    await db.refresh(entry)
    return ProfileExperienceRead.model_validate(entry)


async def delete_experience(
    db: AsyncSession,
    user: User,
    organization_id: uuid.UUID,
    entry_id: uuid.UUID,
) -> None:
    employee = await get_my_employee(db, user)
    entry = await db.scalar(
        select(EmployeeExperience).where(
            EmployeeExperience.id == entry_id,
            EmployeeExperience.organization_id == organization_id,
            EmployeeExperience.employee_id == employee.id,
        )
    )
    if entry is None:
        raise HTTPException(status_code=404, detail="Experience entry not found.")

    db.add(
        OrganizationAdminLog(
            organization_id=organization_id,
            actor_user_id=user.id,
            action="employee.experience.deleted",
            details={"employee_id": str(employee.id), "entry_id": str(entry.id)},
        )
    )
    await db.delete(entry)
    await db.commit()


async def list_courses(db: AsyncSession, user: User, organization_id: uuid.UUID):
    employee = await get_my_employee(db, user)
    result = await db.execute(
        select(EmployeeCourse)
        .where(
            EmployeeCourse.organization_id == organization_id,
            EmployeeCourse.employee_id == employee.id,
        )
        .order_by(EmployeeCourse.created_at, EmployeeCourse.id)
    )
    return result.scalars().all()


async def create_course(
    db: AsyncSession,
    user: User,
    organization_id: uuid.UUID,
    payload: ProfileCourseCreate,
) -> ProfileCourseRead:
    employee = await get_my_employee(db, user)
    entry = EmployeeCourse(
        id=uuid.uuid4(),
        organization_id=organization_id,
        employee_id=employee.id,
        **payload.model_dump(),
    )
    db.add(entry)
    db.add(
        OrganizationAdminLog(
            organization_id=organization_id,
            actor_user_id=user.id,
            action="employee.course.created",
            details={"employee_id": str(employee.id), "entry_id": str(entry.id)},
        )
    )
    await db.commit()
    await db.refresh(entry)
    return ProfileCourseRead.model_validate(entry)


async def update_course(
    db: AsyncSession,
    user: User,
    organization_id: uuid.UUID,
    entry_id: uuid.UUID,
    payload: ProfileCourseUpdate,
) -> ProfileCourseRead:
    employee = await get_my_employee(db, user)
    entry = await db.scalar(
        select(EmployeeCourse).where(
            EmployeeCourse.id == entry_id,
            EmployeeCourse.organization_id == organization_id,
            EmployeeCourse.employee_id == employee.id,
        )
    )
    if entry is None:
        raise HTTPException(status_code=404, detail="Course entry not found.")

    entry.name = payload.name
    db.add(
        OrganizationAdminLog(
            organization_id=organization_id,
            actor_user_id=user.id,
            action="employee.course.updated",
            details={
                "employee_id": str(employee.id),
                "entry_id": str(entry.id),
                "changed_fields": ["name"],
            },
        )
    )
    await db.commit()
    await db.refresh(entry)
    return ProfileCourseRead.model_validate(entry)


async def delete_course(
    db: AsyncSession,
    user: User,
    organization_id: uuid.UUID,
    entry_id: uuid.UUID,
) -> None:
    employee = await get_my_employee(db, user)
    entry = await db.scalar(
        select(EmployeeCourse).where(
            EmployeeCourse.id == entry_id,
            EmployeeCourse.organization_id == organization_id,
            EmployeeCourse.employee_id == employee.id,
        )
    )
    if entry is None:
        raise HTTPException(status_code=404, detail="Course entry not found.")

    db.add(
        OrganizationAdminLog(
            organization_id=organization_id,
            actor_user_id=user.id,
            action="employee.course.deleted",
            details={"employee_id": str(employee.id), "entry_id": str(entry.id)},
        )
    )
    await db.delete(entry)
    await db.commit()