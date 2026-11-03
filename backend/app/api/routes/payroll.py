import uuid

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.payroll import PayrollProfileRead, PayrollProfileUpdate, PayrollProfileWithEmployee, SalaryHistoryRead
from app.services import payroll_service

router = APIRouter(prefix="/payroll", tags=["payroll"])


@router.get("/profiles", response_model=list[PayrollProfileWithEmployee])
async def list_profiles(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO", "Accounts")),
):
    return await payroll_service.list_payroll_profiles(db)


@router.get("/profiles/{employee_id}", response_model=PayrollProfileRead)
async def get_profile(
    employee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO", "Accounts")),
):
    return await payroll_service.get_payroll_profile(db, employee_id)


@router.get("/profiles/{employee_id}/history", response_model=list[SalaryHistoryRead])
async def get_history(
    employee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO", "Accounts")),
):
    return await payroll_service.list_salary_history(db, employee_id)


@router.patch("/profiles/{employee_id}", response_model=PayrollProfileRead)
async def update_profile(
    employee_id: uuid.UUID,
    payload: PayrollProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("Accounts")),
):
    return await payroll_service.update_payroll_profile(db, employee_id, payload, current_user)


@router.get("/export")
async def export_excel(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO", "Accounts")),
):
    content = await payroll_service.export_payroll_excel(db)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=payroll_export.xlsx"},
    )