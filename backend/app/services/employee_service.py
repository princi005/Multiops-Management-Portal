"""
Employee lifecycle, availability, and skills. Onboarding/password-reset
use the Supabase service_role key - see app/core/supabase_admin.py.
"""

import secrets
import uuid

from fastapi import HTTPException, status
from sqlalchemy import delete as sa_delete
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.supabase_admin import get_supabase_admin
from app.models.employee import Employee
from app.models.employee_skill import EmployeeSkill
from app.models.skill import Skill
from app.models.user import User
from app.schemas.employee import (
    AvailabilityUpdate,
    EmployeeCreate,
    EmployeeOnboardRequest,
    EmployeeUpdate,
    PasswordResetResponse,
)


async def list_employees(db: AsyncSession) -> list[Employee]:
    result = await db.execute(
        select(Employee).options(selectinload(Employee.department)).order_by(Employee.employee_code)
    )
    return list(result.scalars().all())


async def get_employee(db: AsyncSession, employee_id: uuid.UUID) -> Employee:
    result = await db.execute(
        select(Employee).where(Employee.id == employee_id).options(selectinload(Employee.department))
    )
    employee = result.scalar_one_or_none()
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")
    return employee


async def get_employee_by_user_id(db: AsyncSession, user_id: uuid.UUID) -> Employee | None:
    result = await db.execute(select(Employee).where(Employee.user_id == user_id))
    return result.scalar_one_or_none()


async def create_employee(db: AsyncSession, payload: EmployeeCreate) -> Employee:
    result = await db.execute(select(User).where(User.id == payload.user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No user account exists with that user_id. Create the account first.",
        )

    result = await db.execute(select(Employee).where(Employee.user_id == payload.user_id))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An employee record already exists for this user.")

    user.full_name = payload.full_name
    user.email = payload.email

    employee = Employee(
        id=uuid.uuid4(),
        user_id=payload.user_id,
        employee_code=payload.employee_code,
        designation=payload.designation,
        phone=payload.phone,
        date_of_joining=payload.date_of_joining,
        employment_status=payload.employment_status,
        department_id=payload.department_id,
    )
    db.add(employee)
    await db.commit()
    await db.refresh(employee, attribute_names=["department"])
    return employee


async def update_employee(db: AsyncSession, employee_id: uuid.UUID, payload: EmployeeUpdate) -> Employee:
    employee = await get_employee(db, employee_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(employee, field, value)
    await db.commit()
    await db.refresh(employee, attribute_names=["department"])
    return employee


async def update_availability(db: AsyncSession, employee_id: uuid.UUID, payload: AvailabilityUpdate) -> Employee:
    employee = await get_employee(db, employee_id)
    employee.availability_status = payload.availability_status
    await db.commit()
    await db.refresh(employee, attribute_names=["department"])
    return employee


async def deactivate_employee(db: AsyncSession, employee_id: uuid.UUID) -> Employee:
    from app.models.employee import EmploymentStatus as Status

    employee = await get_employee(db, employee_id)
    employee.employment_status = Status.INACTIVE

    result = await db.execute(select(User).where(User.id == employee.user_id))
    user = result.scalar_one_or_none()
    if user is not None:
        user.is_active = False

    await db.commit()
    await db.refresh(employee, attribute_names=["department"])
    return employee


async def onboard_employee(db: AsyncSession, payload: EmployeeOnboardRequest) -> Employee:
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A user with this email already exists.")

    admin_client = get_supabase_admin()
    try:
        created = admin_client.auth.admin.create_user(
            {"email": payload.email, "password": payload.temporary_password, "email_confirm": True}
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Could not create login account: {exc}") from exc

    user_id = uuid.UUID(created.user.id)
    user = User(id=user_id, email=payload.email, full_name=payload.full_name, is_active=True)
    db.add(user)
    await db.flush()

    employee = Employee(
        id=uuid.uuid4(),
        user_id=user_id,
        employee_code=payload.employee_code,
        designation=payload.designation,
        phone=payload.phone,
        date_of_joining=payload.date_of_joining,
        employment_status=payload.employment_status,
        department_id=payload.department_id,
    )
    db.add(employee)
    await db.commit()
    await db.refresh(employee, attribute_names=["department"])
    return employee


async def reset_employee_password(db: AsyncSession, employee_id: uuid.UUID) -> PasswordResetResponse:
    employee = await get_employee(db, employee_id)
    result = await db.execute(select(User).where(User.id == employee.user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No login account found for this employee.")

    new_password = secrets.token_urlsafe(12)
    admin_client = get_supabase_admin()
    try:
        admin_client.auth.admin.update_user_by_id(str(user.id), {"password": new_password})
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Could not reset password: {exc}") from exc

    return PasswordResetResponse(employee_id=employee.id, email=user.email, temporary_password=new_password)


async def list_employee_skills(db: AsyncSession, employee_id: uuid.UUID) -> list[Skill]:
    await get_employee(db, employee_id)
    result = await db.execute(
        select(Skill).join(EmployeeSkill, EmployeeSkill.skill_id == Skill.id).where(EmployeeSkill.employee_id == employee_id)
    )
    return list(result.scalars().all())


async def assign_skill(db: AsyncSession, employee_id: uuid.UUID, skill_id: uuid.UUID) -> list[Skill]:
    await get_employee(db, employee_id)
    result = await db.execute(select(Skill).where(Skill.id == skill_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Skill not found.")

    result = await db.execute(
        select(EmployeeSkill).where(EmployeeSkill.employee_id == employee_id, EmployeeSkill.skill_id == skill_id)
    )
    if result.scalar_one_or_none() is None:
        db.add(EmployeeSkill(employee_id=employee_id, skill_id=skill_id))
        await db.commit()
    return await list_employee_skills(db, employee_id)


async def remove_skill(db: AsyncSession, employee_id: uuid.UUID, skill_id: uuid.UUID) -> list[Skill]:
    await db.execute(
        sa_delete(EmployeeSkill).where(EmployeeSkill.employee_id == employee_id, EmployeeSkill.skill_id == skill_id)
    )
    await db.commit()
    return await list_employee_skills(db, employee_id)