"""
Read-only employee directory for managers (names are needed to choose project
members and ticket assignees). Only active employees, and only non-sensitive
fields: no salary, phone or other personal data.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.employee import Employee, EmploymentStatus
from app.schemas.directory import DirectoryEmployee


async def list_active_employees(db: AsyncSession) -> list[DirectoryEmployee]:
    result = await db.execute(
        select(Employee)
        .where(Employee.employment_status == EmploymentStatus.ACTIVE)
        .options(selectinload(Employee.user), selectinload(Employee.department))
        .order_by(Employee.employee_code)
    )
    return [
        DirectoryEmployee(
            id=emp.id,
            employee_code=emp.employee_code,
            full_name=emp.user.full_name,
            email=emp.user.email,
            designation=emp.designation,
            department_name=emp.department.name if emp.department else None,
        )
        for emp in result.scalars().all()
    ]