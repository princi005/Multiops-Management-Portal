"""
Self-service reads for the logged-in user. Every query here is scoped to
the caller's own employee record (looked up from their user id), so no
employee id is ever accepted from the client - one person can never read
another person's data through these endpoints.
"""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.employee import Employee
from app.models.employee_skill import EmployeeSkill
from app.models.payroll_profile import PayrollProfile
from app.models.salary_history import SalaryHistory
from app.models.skill import Skill
from app.models.user import User
from app.schemas.employee import SkillTag
from app.schemas.me import MyProfile, MySalary, MySalaryHistoryItem


async def get_my_employee(db: AsyncSession, user: User) -> Employee:
    result = await db.execute(
        select(Employee).where(Employee.user_id == user.id).options(selectinload(Employee.department))
    )
    employee = result.scalar_one_or_none()
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No employee record is linked to your account.",
        )
    return employee


async def get_my_profile(db: AsyncSession, user: User) -> MyProfile:
    employee = await get_my_employee(db, user)

    skills_result = await db.execute(
        select(Skill)
        .join(EmployeeSkill, EmployeeSkill.skill_id == Skill.id)
        .where(EmployeeSkill.employee_id == employee.id)
        .order_by(Skill.name)
    )
    skills = [SkillTag(id=s.id, name=s.name) for s in skills_result.scalars().all()]

    return MyProfile(
        employee_id=employee.id,
        employee_code=employee.employee_code,
        full_name=user.full_name,
        email=user.email,
        designation=employee.designation,
        phone=employee.phone,
        date_of_joining=employee.date_of_joining,
        department_name=employee.department.name if employee.department else None,
        employment_status=employee.employment_status,
        availability_status=employee.availability_status,
        skills=skills,
        roles=sorted(ur.role.name for ur in user.user_roles),
    )


async def get_my_salary(db: AsyncSession, user: User) -> MySalary:
    employee = await get_my_employee(db, user)

    result = await db.execute(select(PayrollProfile).where(PayrollProfile.employee_id == employee.id))
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No payroll profile has been set up for you yet.",
        )

    history_result = await db.execute(
        select(SalaryHistory)
        .where(SalaryHistory.employee_id == employee.id)
        .order_by(SalaryHistory.created_at.desc())
    )
    # Internal fields (reason, who changed it) are deliberately left out.
    history = [
        MySalaryHistoryItem(
            effective_date=h.effective_date,
            basic_salary=float(h.basic_salary),
            allowances=h.allowances,
            deductions=h.deductions,
            benefits=h.benefits,
            action=h.action,
            created_at=h.created_at,
        )
        for h in history_result.scalars().all()
    ]

    return MySalary(
        basic_salary=float(profile.basic_salary),
        pay_frequency=profile.pay_frequency,
        allowances=profile.allowances,
        deductions=profile.deductions,
        benefits=profile.benefits,
        pan=profile.pan,
        bank_account_number=profile.bank_account_number,
        ifsc=profile.ifsc,
        effective_date=profile.effective_date,
        history=history,
    )