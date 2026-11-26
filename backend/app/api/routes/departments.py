"""
Department endpoints — minimal for Phase 1, mainly to support employee
department assignment.
"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.organization_roles import require_org_role
from app.db.session import get_db
from app.models.department import Department
from app.models.user import User
from app.schemas.department import DepartmentCreate, DepartmentRead

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("", response_model=list[DepartmentRead])
async def list_departments(
    db: AsyncSession = Depends(get_db),
    active=Depends(require_org_role("CEO", "HR")),
):
    organization, _membership = active
    result = await db.execute(
        select(Department)
        .where(Department.organization_id == organization.id)
        .order_by(Department.name)
    )
    return result.scalars().all()


@router.post("", response_model=DepartmentRead, status_code=201)
async def create_department(
    payload: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    active=Depends(require_org_role("HR")),
):
    organization, _membership = active
    department = Department(
        id=uuid.uuid4(),
        organization_id=organization.id,
        **payload.model_dump(),
    )
    db.add(department)
    await db.commit()
    await db.refresh(department)
    return department