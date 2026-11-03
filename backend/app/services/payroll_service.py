"""
Payroll profile logic. payroll_profiles holds each employee's current
salary configuration (mutable, updated in place). Every create or
update appends an immutable row to salary_history. Creating or updating
a profile never touches the general ledger - that only happens later,
when an actual payroll run pays it (a future step).
"""

import uuid
from datetime import date, datetime, timezone
from io import BytesIO

from fastapi import HTTPException, status
from openpyxl import Workbook
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.employee import Employee
from app.models.payroll_profile import PayrollProfile
from app.models.salary_history import SalaryHistory
from app.models.user import User
from app.schemas.payroll import (
    PayrollProfileInput,
    PayrollProfileUpdate,
    PayrollProfileWithEmployee,
    SalaryHistoryRead,
)


def _write_history(
    db: AsyncSession, employee_id: uuid.UUID, data: PayrollProfileInput, action: str, reason: str, changed_by: User
) -> None:
    db.add(
        SalaryHistory(
            id=uuid.uuid4(),
            employee_id=employee_id,
            basic_salary=data.basic_salary,
            allowances=data.allowances,
            deductions=data.deductions,
            benefits=data.benefits,
            pan=data.pan,
            bank_account_number=data.bank_account_number,
            ifsc=data.ifsc,
            effective_date=data.effective_date or date.today(),
            action=action,
            reason=reason,
            changed_by_id=changed_by.id,
        )
    )


async def create_payroll_profile(
    db: AsyncSession, employee_id: uuid.UUID, data: PayrollProfileInput, created_by: User
) -> PayrollProfile:
    """
    Caller (employee_request_service.approve_request) is responsible for
    the final commit - this only adds to the session.
    """
    result = await db.execute(select(PayrollProfile).where(PayrollProfile.employee_id == employee_id))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="A payroll profile already exists for this employee."
        )

    profile = PayrollProfile(
        id=uuid.uuid4(),
        employee_id=employee_id,
        basic_salary=data.basic_salary,
        pay_frequency=data.pay_frequency,
        allowances=data.allowances,
        deductions=data.deductions,
        benefits=data.benefits,
        pan=data.pan,
        bank_account_number=data.bank_account_number,
        ifsc=data.ifsc,
        effective_date=data.effective_date or date.today(),
    )
    db.add(profile)
    _write_history(db, employee_id, data, "create", "Initial payroll profile created on employee onboarding", created_by)
    return profile


async def update_payroll_profile(
    db: AsyncSession, employee_id: uuid.UUID, payload: PayrollProfileUpdate, changed_by: User
) -> PayrollProfile:
    result = await db.execute(select(PayrollProfile).where(PayrollProfile.employee_id == employee_id))
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No payroll profile exists for this employee yet."
        )

    profile.basic_salary = payload.basic_salary
    profile.pay_frequency = payload.pay_frequency
    profile.allowances = payload.allowances
    profile.deductions = payload.deductions
    profile.benefits = payload.benefits
    profile.pan = payload.pan
    profile.bank_account_number = payload.bank_account_number
    profile.ifsc = payload.ifsc
    profile.effective_date = payload.effective_date or date.today()
    profile.updated_at = datetime.now(timezone.utc)

    _write_history(db, employee_id, payload, "update", payload.reason.strip(), changed_by)

    await db.commit()
    await db.refresh(profile)
    return profile


async def get_payroll_profile(db: AsyncSession, employee_id: uuid.UUID) -> PayrollProfile:
    result = await db.execute(select(PayrollProfile).where(PayrollProfile.employee_id == employee_id))
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No payroll profile exists for this employee.")
    return profile


async def list_payroll_profiles(db: AsyncSession) -> list[PayrollProfileWithEmployee]:
    result = await db.execute(
        select(PayrollProfile, Employee)
        .join(Employee, Employee.id == PayrollProfile.employee_id)
        .order_by(Employee.employee_code)
    )
    profiles: list[PayrollProfileWithEmployee] = []
    for profile, employee in result.all():
        profiles.append(
            PayrollProfileWithEmployee(
                id=profile.id,
                employee_id=profile.employee_id,
                basic_salary=float(profile.basic_salary),
                pay_frequency=profile.pay_frequency,
                allowances=profile.allowances,
                deductions=profile.deductions,
                benefits=profile.benefits,
                pan=profile.pan,
                bank_account_number=profile.bank_account_number,
                ifsc=profile.ifsc,
                status=profile.status,
                effective_date=profile.effective_date,
                created_at=profile.created_at,
                updated_at=profile.updated_at,
                employee_code=employee.employee_code,
                employee_designation=employee.designation,
            )
        )
    return profiles


async def list_salary_history(db: AsyncSession, employee_id: uuid.UUID) -> list[SalaryHistoryRead]:
    result = await db.execute(
        select(SalaryHistory)
        .where(SalaryHistory.employee_id == employee_id)
        .options(selectinload(SalaryHistory.changed_by))
        .order_by(SalaryHistory.created_at.desc())
    )
    return [
        SalaryHistoryRead(
            id=h.id,
            employee_id=h.employee_id,
            basic_salary=float(h.basic_salary),
            allowances=h.allowances,
            deductions=h.deductions,
            benefits=h.benefits,
            pan=h.pan,
            bank_account_number=h.bank_account_number,
            ifsc=h.ifsc,
            effective_date=h.effective_date,
            action=h.action,
            reason=h.reason,
            changed_by_id=h.changed_by_id,
            changed_by_email=h.changed_by.email if h.changed_by else None,
            created_at=h.created_at,
        )
        for h in result.scalars().all()
    ]


async def export_payroll_excel(db: AsyncSession) -> bytes:
    profiles = await list_payroll_profiles(db)

    wb = Workbook()
    ws = wb.active
    ws.title = "Payroll"
    ws.append(
        [
            "Employee Code",
            "Designation",
            "Basic Salary",
            "Pay Frequency",
            "Allowances Total",
            "Deductions Total",
            "Benefits Total",
            "PAN",
            "Bank Account",
            "IFSC",
            "Status",
            "Effective Date",
        ]
    )
    for p in profiles:
        ws.append(
            [
                p.employee_code,
                p.employee_designation or "",
                float(p.basic_salary),
                p.pay_frequency.value,
                sum(p.allowances.values()) if p.allowances else 0,
                sum(p.deductions.values()) if p.deductions else 0,
                sum(p.benefits.values()) if p.benefits else 0,
                p.pan or "",
                p.bank_account_number or "",
                p.ifsc or "",
                p.status.value,
                p.effective_date.isoformat(),
            ]
        )

    buffer = BytesIO()
    wb.save(buffer)
    return buffer.getvalue()