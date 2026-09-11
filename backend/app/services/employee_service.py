"""
Business logic for employees — kept separate from the API routes so
route handlers stay thin, and this logic is reusable (e.g. later from
the dashboard service, or a future seed/import script).
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.supabase_admin import get_supabase_admin
from app.models.employee import Employee
from app.models.user import User
from app.schemas.employee import EmployeeCreate, EmployeeOnboardRequest, EmployeeUpdate

async def list_employees(db: AsyncSession) -> list[Employee]:
    result = await db.execute(
        select(Employee).options(selectinload(Employee.department)).order_by(Employee.employee_code)
    )
    return list(result.scalars().all())


async def get_employee(db: AsyncSession, employee_id: uuid.UUID) -> Employee:
    result = await db.execute(
        select(Employee)
        .where(Employee.id == employee_id)
        .options(selectinload(Employee.department))
    )
    employee = result.scalar_one_or_none()
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")
    return employee


async def create_employee(db: AsyncSession, payload: EmployeeCreate) -> Employee:
    # Ensure the referenced user exists, and doesn't already have an employee record
    result = await db.execute(select(User).where(User.id == payload.user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No user account exists with that user_id. Create the account first.",
        )

async def onboard_employee(db: AsyncSession, payload: EmployeeOnboardRequest) -> Employee:
    """
    Creates a Supabase Auth account for a brand-new hire, then the
    matching users + employees rows — same pattern as scripts/seed_data.py,
    but exposed as a real HR-facing API action.
    """
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )

    admin_client = get_supabase_admin()
    try:
        created = admin_client.auth.admin.create_user(
            {
                "email": payload.email,
                "password": payload.temporary_password,
                "email_confirm": True,
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not create login account: {exc}",
        ) from exc

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


    result = await db.execute(select(Employee).where(Employee.user_id == payload.user_id))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An employee record already exists for this user.",
        )

    # Keep the users row in sync with the name/email provided here
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

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)

    await db.commit()
    await db.refresh(employee, attribute_names=["department"])
    return employee


async def deactivate_employee(db: AsyncSession, employee_id: uuid.UUID) -> Employee:
    from app.models.employee import EmploymentStatus as Status

    employee = await get_employee(db, employee_id)
    employee.employment_status = Status.INACTIVE
    await db.commit()
    await db.refresh(employee, attribute_names=["department"])
    return employee