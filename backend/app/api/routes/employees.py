import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.employee import (
    AssignSkill,
    AvailabilityUpdate,
    EmployeeCreate,
    EmployeeOnboardRequest,
    EmployeeRead,
    EmployeeUpdate,
    PasswordResetResponse,
    SkillTag,
)
from app.services import employee_service

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("", response_model=list[EmployeeRead])
async def list_employees(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO", "HR", "Accounts", "Manager")),
):
    return await employee_service.list_employees(db)


@router.get("/{employee_id}", response_model=EmployeeRead)
async def get_employee(
    employee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO", "HR", "Accounts", "Manager")),
):
    return await employee_service.get_employee(db, employee_id)


@router.post("", response_model=EmployeeRead, status_code=201)
async def create_employee(
    payload: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("Accounts")),
):
    return await employee_service.create_employee(db, payload)


@router.post("/onboard", response_model=EmployeeRead, status_code=201)
async def onboard_employee(
    payload: EmployeeOnboardRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("Accounts")),
):
    return await employee_service.onboard_employee(db, payload)


@router.patch("/{employee_id}", response_model=EmployeeRead)
async def update_employee(
    employee_id: uuid.UUID,
    payload: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("HR", "Accounts")),
):
    if "HR" in [r.role.name for r in current_user.user_roles] and payload.employment_status is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR cannot change employment status directly. Submit an exit request instead.",
        )
    return await employee_service.update_employee(db, employee_id, payload)


@router.patch("/{employee_id}/availability", response_model=EmployeeRead)
async def update_availability(
    employee_id: uuid.UUID,
    payload: AvailabilityUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("HR", "Accounts", "Manager")),
):
    return await employee_service.update_availability(db, employee_id, payload)


@router.delete("/{employee_id}", response_model=EmployeeRead)
async def deactivate_employee(
    employee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("Accounts")),
):
    return await employee_service.deactivate_employee(db, employee_id)


@router.post("/{employee_id}/reset-password", response_model=PasswordResetResponse)
async def reset_password(
    employee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("Accounts")),
):
    return await employee_service.reset_employee_password(db, employee_id)


@router.get("/{employee_id}/skills", response_model=list[SkillTag])
async def list_skills(
    employee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO", "HR", "Accounts", "Manager")),
):
    return await employee_service.list_employee_skills(db, employee_id)


@router.post("/{employee_id}/skills", response_model=list[SkillTag])
async def assign_skill(
    employee_id: uuid.UUID,
    payload: AssignSkill,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("HR", "Manager")),
):
    return await employee_service.assign_skill(db, employee_id, payload.skill_id)


@router.delete("/{employee_id}/skills/{skill_id}", response_model=list[SkillTag])
async def remove_skill(
    employee_id: uuid.UUID,
    skill_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("HR", "Manager")),
):
    return await employee_service.remove_skill(db, employee_id, skill_id)