"""
Aggregation queries for the CEO dashboard. Kept separate from the route
so these queries are reusable later (e.g. a future /dashboard/hr, or
scheduled reports).
"""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.models.employee import Employee, EmploymentStatus
from app.schemas.dashboard import (
    CeoDashboardSummary,
    DepartmentHeadcount,
    EmploymentStatusBreakdown,
)


async def get_ceo_summary(db: AsyncSession) -> CeoDashboardSummary:
    total_employees_result = await db.execute(select(func.count(Employee.id)))
    total_employees = total_employees_result.scalar_one()

    total_departments_result = await db.execute(select(func.count(Department.id)))
    total_departments = total_departments_result.scalar_one()

    active_employees_result = await db.execute(
        select(func.count(Employee.id)).where(Employee.employment_status == EmploymentStatus.ACTIVE)
    )
    active_employees = active_employees_result.scalar_one()

    dept_breakdown_result = await db.execute(
        select(Department.name, func.count(Employee.id))
        .outerjoin(Employee, Employee.department_id == Department.id)
        .group_by(Department.name)
        .order_by(Department.name)
    )
    department_breakdown = [
        DepartmentHeadcount(department_name=name, employee_count=count)
        for name, count in dept_breakdown_result.all()
    ]

    status_breakdown_result = await db.execute(
        select(Employee.employment_status, func.count(Employee.id)).group_by(Employee.employment_status)
    )
    status_breakdown = [
        EmploymentStatusBreakdown(status=status.value, count=count)
        for status, count in status_breakdown_result.all()
    ]

    return CeoDashboardSummary(
        total_employees=total_employees,
        total_departments=total_departments,
        active_employees=active_employees,
        department_breakdown=department_breakdown,
        status_breakdown=status_breakdown,
    )