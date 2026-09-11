"""
Department endpoints — minimal for Phase 1, mainly to support employee
department assignment.
"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_role
from app.db.session import get_db
from app.models.department import Department
from app.models.user import User
from app.schemas.department import DepartmentCreate, DepartmentRead

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("", response_model=list[DepartmentRead])
async def list_departments(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO", "HR")),
):
    result = await db.execute(select(Department).order_by(Department.name))
    return result.scalars().all()


@router.post("", response_model=DepartmentRead, status_code=201)
async def create_department(
    payload: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("HR")),
):
    department = Department(id=uuid.uuid4(), **payload.model_dump())
    db.add(department)
    await db.commit()
    await db.refresh(department)
    return department