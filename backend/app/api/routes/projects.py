import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.project import AddProjectMember, ProjectCreate, ProjectRead, ProjectUpdate
from app.services import project_service

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectRead])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("Manager", "Employee")),
):
    return await project_service.list_projects(db, user)


@router.post("", response_model=ProjectRead, status_code=201)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("Manager")),
):
    return await project_service.create_project(db, payload, user)


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("Manager", "Employee")),
):
    return await project_service.get_project(db, project_id, user)


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("Manager")),
):
    return await project_service.update_project(db, project_id, payload, user)


@router.post("/{project_id}/members", response_model=ProjectRead, status_code=201)
async def add_member(
    project_id: uuid.UUID,
    payload: AddProjectMember,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("Manager")),
):
    return await project_service.add_member(db, project_id, payload.employee_id, user)


@router.delete("/{project_id}/members/{employee_id}", response_model=ProjectRead)
async def remove_member(
    project_id: uuid.UUID,
    employee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("Manager")),
):
    return await project_service.remove_member(db, project_id, employee_id, user)