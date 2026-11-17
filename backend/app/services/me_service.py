"""
Self-service reads and edits for the logged-in user. Every query here is
scoped to the caller's own employee record (looked up from their user id),
so no employee id is ever accepted from the client - one person can never
read or change another person's data through these endpoints.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
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


async def set_my_skills(db: AsyncSession, user: User, names: list[str]) -> list[SkillTag]:
    """
    Replace the caller's skill set with `names` (already cleaned and
    de-duplicated by the request schema). Names are matched to the shared
    skills catalog case-insensitively, so "react" reuses the existing
    "React" entry; a name that is not in the catalog yet is added to it.
    """
    employee = await get_my_employee(db, user)

    by_lower: dict[str, Skill] = {}
    if names:
        result = await db.execute(select(Skill).where(func.lower(Skill.name).in_([n.lower() for n in names])))
        for skill in result.scalars().all():
            by_lower[skill.name.lower()] = skill

    desired: list[Skill] = []
    for name in names:
        skill = by_lower.get(name.lower())
        if skill is None:
            skill = Skill(id=uuid.uuid4(), name=name)
            db.add(skill)
            by_lower[name.lower()] = skill
        desired.append(skill)

    try:
        await db.flush()  # gives new catalog rows their ids and surfaces unique-name clashes

        current_result = await db.execute(
            select(EmployeeSkill.skill_id).where(EmployeeSkill.employee_id == employee.id)
        )
        current_ids = set(current_result.scalars().all())
        desired_ids = {s.id for s in desired}

        remove_ids = current_ids - desired_ids
        if remove_ids:
            await db.execute(
                delete(EmployeeSkill)
                .where(EmployeeSkill.employee_id == employee.id, EmployeeSkill.skill_id.in_(list(remove_ids)))
                .execution_options(synchronize_session=False)
            )
        for skill_id in desired_ids - current_ids:
            db.add(EmployeeSkill(employee_id=employee.id, skill_id=skill_id))

        # Build the response before committing so no attribute is read from an expired object.
        tags = [SkillTag(id=s.id, name=s.name) for s in sorted(desired, key=lambda s: s.name.lower())]
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Someone just added the same skill. Please try again.",
        )

    return tags


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