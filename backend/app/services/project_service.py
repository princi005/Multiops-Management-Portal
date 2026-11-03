"""
Project access control lives here, used by both routes/projects.py and
routes/tickets.py (a ticket's access = its project's access).

ensure_project_access: the current user may see a project only if they
are its manager or an assigned member. CEO and Accounts get no
exception, per the confirmed architecture decision.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import delete as sa_delete
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.employee import Employee
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.employee_service import get_employee_by_user_id


async def _require_manager_employee(db: AsyncSession, user: User) -> Employee:
    employee = await get_employee_by_user_id(db, user.id)
    if employee is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No employee record linked to this account.")
    return employee


async def load_project(db: AsyncSession, project_id: uuid.UUID) -> Project:
    result = await db.execute(
        select(Project)
        .where(Project.id == project_id)
        .options(selectinload(Project.members))
        .execution_options(populate_existing=True)
    )
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return project


async def ensure_project_access(db: AsyncSession, project: Project, user: User) -> Employee:
    employee = await get_employee_by_user_id(db, user.id)
    if employee is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this project.")
    if project.manager_id == employee.id:
        return employee
    if any(m.employee_id == employee.id for m in project.members):
        return employee
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this project.")


async def require_owning_manager(db: AsyncSession, project: Project, user: User) -> Employee:
    employee = await get_employee_by_user_id(db, user.id)
    if employee is None or project.manager_id != employee.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only this project's manager can do that.")
    return employee


async def create_project(db: AsyncSession, payload: ProjectCreate, user: User) -> Project:
    manager = await _require_manager_employee(db, user)
    project = Project(id=uuid.uuid4(), manager_id=manager.id, created_by_id=user.id, **payload.model_dump())
    db.add(project)
    await db.commit()
    return await load_project(db, project.id)


async def get_project(db: AsyncSession, project_id: uuid.UUID, user: User) -> Project:
    project = await load_project(db, project_id)
    await ensure_project_access(db, project, user)
    return project


async def list_projects(db: AsyncSession, user: User) -> list[Project]:
    employee = await get_employee_by_user_id(db, user.id)
    if employee is None:
        return []
    result = await db.execute(
        select(Project)
        .outerjoin(ProjectMember, ProjectMember.project_id == Project.id)
        .where(or_(Project.manager_id == employee.id, ProjectMember.employee_id == employee.id))
        .options(selectinload(Project.members))
        .order_by(Project.created_at.desc())
    )
    return list(result.scalars().unique().all())


async def update_project(db: AsyncSession, project_id: uuid.UUID, payload: ProjectUpdate, user: User) -> Project:
    project = await load_project(db, project_id)
    await require_owning_manager(db, project, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await db.commit()
    return await load_project(db, project_id)


async def add_member(db: AsyncSession, project_id: uuid.UUID, employee_id: uuid.UUID, user: User) -> Project:
    project = await load_project(db, project_id)
    await require_owning_manager(db, project, user)

    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee not found.")
    if employee_id == project.manager_id or any(m.employee_id == employee_id for m in project.members):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee is already on this project.")

    db.add(ProjectMember(project_id=project.id, employee_id=employee_id, added_by_id=user.id))
    await db.commit()
    return await load_project(db, project_id)


async def remove_member(db: AsyncSession, project_id: uuid.UUID, employee_id: uuid.UUID, user: User) -> Project:
    project = await load_project(db, project_id)
    await require_owning_manager(db, project, user)

    await db.execute(
        sa_delete(ProjectMember).where(
            ProjectMember.project_id == project.id,
            ProjectMember.employee_id == employee_id,
        )
    )
    await db.commit()
    return await load_project(db, project_id)