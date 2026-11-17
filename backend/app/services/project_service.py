"""
Project access and lifecycle rules.

A project is visible to its owning manager and assigned members while
active. Soft-deleted projects are hidden from regular access and appear
only in the owning manager's project bin.
"""

import uuid
from datetime import datetime, timedelta, timezone

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


RECOVERY_DAYS = 30


async def _require_manager_employee(db: AsyncSession, user: User) -> Employee:
    """Return the employee record linked to the manager's user account."""
    employee = await get_employee_by_user_id(db, user.id)

    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No employee record linked to this account.",
        )

    return employee


async def load_project(db: AsyncSession, project_id: uuid.UUID) -> Project:
    """Load an active project and its members."""
    result = await db.execute(
        select(Project)
        .where(
            Project.id == project_id,
            Project.deleted_at.is_(None),
        )
        .options(selectinload(Project.members))
        .execution_options(populate_existing=True)
    )
    project = result.scalar_one_or_none()

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    return project


async def _load_project_for_bin(
    db: AsyncSession,
    project_id: uuid.UUID,
) -> Project:
    """Load a project regardless of whether it has been soft-deleted."""
    result = await db.execute(
        select(Project)
        .where(Project.id == project_id)
        .options(selectinload(Project.members))
        .execution_options(populate_existing=True)
    )
    project = result.scalar_one_or_none()

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    return project


async def ensure_project_access(
    db: AsyncSession,
    project: Project,
    user: User,
) -> Employee:
    """Allow access only to the project's manager or an assigned member."""
    employee = await get_employee_by_user_id(db, user.id)

    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this project.",
        )

    if project.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    if project.manager_id == employee.id:
        return employee

    if any(member.employee_id == employee.id for member in project.members):
        return employee

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have access to this project.",
    )


async def require_owning_manager(
    db: AsyncSession,
    project: Project,
    user: User,
) -> Employee:
    """Require the current user to own the project as its manager."""
    employee = await get_employee_by_user_id(db, user.id)

    if employee is None or project.manager_id != employee.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only this project's manager can do that.",
        )

    return employee


async def create_project(
    db: AsyncSession,
    payload: ProjectCreate,
    user: User,
) -> Project:
    manager = await _require_manager_employee(db, user)

    project = Project(
        id=uuid.uuid4(),
        manager_id=manager.id,
        created_by_id=user.id,
        **payload.model_dump(),
    )

    db.add(project)
    await db.commit()

    return await load_project(db, project.id)


async def get_project(
    db: AsyncSession,
    project_id: uuid.UUID,
    user: User,
) -> Project:
    project = await load_project(db, project_id)
    await ensure_project_access(db, project, user)
    return project


async def list_projects(
    db: AsyncSession,
    user: User,
) -> list[Project]:
    """List active projects owned by or assigned to the current employee."""
    employee = await get_employee_by_user_id(db, user.id)

    if employee is None:
        return []

    result = await db.execute(
        select(Project)
        .outerjoin(
            ProjectMember,
            ProjectMember.project_id == Project.id,
        )
        .where(
            or_(
                Project.manager_id == employee.id,
                ProjectMember.employee_id == employee.id,
            ),
            Project.deleted_at.is_(None),
        )
        .options(selectinload(Project.members))
        .order_by(Project.created_at.desc())
    )

    return list(result.scalars().unique().all())


async def list_deleted_projects(
    db: AsyncSession,
    user: User,
) -> list[Project]:
    """List deleted projects in the current manager's bin."""
    manager = await _require_manager_employee(db, user)

    result = await db.execute(
        select(Project)
        .where(
            Project.manager_id == manager.id,
            Project.deleted_at.is_not(None),
        )
        .options(selectinload(Project.members))
        .order_by(Project.deleted_at.desc())
    )

    return list(result.scalars().unique().all())


async def update_project(
    db: AsyncSession,
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    user: User,
) -> Project:
    project = await load_project(db, project_id)
    await require_owning_manager(db, project, user)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)

    await db.commit()
    return await load_project(db, project_id)


async def soft_delete_project(
    db: AsyncSession,
    project_id: uuid.UUID,
    user: User,
) -> Project:
    """Move the manager's project to the bin and start its 30-day window."""
    project = await _load_project_for_bin(db, project_id)
    await require_owning_manager(db, project, user)

    if project.deleted_at is None:
        project.deleted_at = datetime.now(timezone.utc)
        project.deleted_by_id = user.id
        await db.commit()
        await db.refresh(project)

    return project


async def restore_project(
    db: AsyncSession,
    project_id: uuid.UUID,
    user: User,
) -> Project:
    """Restore a deleted project if its 30-day recovery window is open."""
    project = await _load_project_for_bin(db, project_id)
    await require_owning_manager(db, project, user)

    if project.deleted_at is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project is not in the bin.",
        )

    cutoff = datetime.now(timezone.utc) - timedelta(days=RECOVERY_DAYS)

    if project.deleted_at < cutoff:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="The 30-day recovery period has expired.",
        )

    project.deleted_at = None
    project.deleted_by_id = None
    await db.commit()

    return await load_project(db, project_id)


async def purge_expired_projects(db: AsyncSession) -> int:
    """
    Permanently delete projects whose 30-day recovery window has expired.

    Call this function from a scheduled job. Database foreign keys cascade
    the deletion to project members and tickets.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=RECOVERY_DAYS)

    result = await db.execute(
        sa_delete(Project).where(
            Project.deleted_at.is_not(None),
            Project.deleted_at < cutoff,
        )
    )

    await db.commit()
    return result.rowcount or 0


async def add_member(
    db: AsyncSession,
    project_id: uuid.UUID,
    employee_id: uuid.UUID,
    user: User,
) -> Project:
    project = await load_project(db, project_id)
    await require_owning_manager(db, project, user)

    result = await db.execute(
        select(Employee).where(Employee.id == employee_id)
    )

    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee not found.",
        )

    if employee_id == project.manager_id or any(
        member.employee_id == employee_id for member in project.members
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee is already on this project.",
        )

    db.add(
        ProjectMember(
            project_id=project.id,
            employee_id=employee_id,
            added_by_id=user.id,
        )
    )

    await db.commit()
    return await load_project(db, project_id)


async def remove_member(
    db: AsyncSession,
    project_id: uuid.UUID,
    employee_id: uuid.UUID,
    user: User,
) -> Project:
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