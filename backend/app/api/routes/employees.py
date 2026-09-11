"""
Employee endpoints — HR can read/write, CEO can read-only.
"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.employee import EmployeeCreate, EmployeeOnboardRequest, EmployeeRead, EmployeeUpdate
from app.services import employee_service

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("", response_model=list[EmployeeRead])
async def list_employees(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO", "HR")),
):
    return await employee_service.list_employees(db)


@router.get("/{employee_id}", response_model=EmployeeRead)
async def get_employee(
    employee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO", "HR")),
):
    return await employee_service.get_employee(db, employee_id)


@router.post("", response_model=EmployeeRead, status_code=201)
async def create_employee(
    payload: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("HR")),
):
    return await employee_service.create_employee(db, payload)

@router.post("/onboard", response_model=EmployeeRead, status_code=201)
async def onboard_employee(
    payload: EmployeeOnboardRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("HR")),
):
    return await employee_service.onboard_employee(db, payload)


@router.patch("/{employee_id}", response_model=EmployeeRead)
async def update_employee(
    employee_id: uuid.UUID,
    payload: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("HR")),
):
    return await employee_service.update_employee(db, employee_id, payload)


@router.delete("/{employee_id}", response_model=EmployeeRead)
async def deactivate_employee(
    employee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("HR")),
):
    """
    Soft-delete: sets employment_status to INACTIVE rather than removing
    the row — preserves history for future knowledge-continuity features.
    """
    return await employee_service.deactivate_employee(db, employee_id)