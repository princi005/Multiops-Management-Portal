import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.organization import (
    Organization,
    OrganizationAdminLog,
    OrganizationMember,
    OrganizationSettings,
    PlatformAdmin,
)
from app.models.user import User
from app.schemas.organization import OrganizationCreate, OrganizationRead
from app.schemas.platform import PlatformAuditRead, PlatformOrganizationUpdate

router = APIRouter(prefix="/platform", tags=["platform-admin"])


async def require_platform_admin(db: AsyncSession, user_id: uuid.UUID) -> None:
    row = await db.get(PlatformAdmin, user_id)
    if row is None or not row.is_active:
        raise HTTPException(status_code=403, detail="Platform Admin access required.")


@router.get("/organizations", response_model=list[OrganizationRead])
async def list_organizations(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    await require_platform_admin(db, user.id)
    result = await db.execute(select(Organization).order_by(Organization.created_at.desc()))
    return result.scalars().all()


@router.get("/audit", response_model=list[PlatformAuditRead])
async def platform_audit(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    await require_platform_admin(db, user.id)
    result = await db.execute(
        select(OrganizationAdminLog, Organization.name)
        .join(Organization, Organization.id == OrganizationAdminLog.organization_id)
        .order_by(OrganizationAdminLog.created_at.desc())
        .limit(300)
    )
    return [
        {
            "id": log.id,
            "organization_id": log.organization_id,
            "organization_name": org_name,
            "actor_user_id": log.actor_user_id,
            "action": log.action,
            "details": log.details,
            "reason": log.reason,
            "created_at": log.created_at,
        }
        for log, org_name in result.all()
    ]


@router.post("/organizations", response_model=OrganizationRead, status_code=201)
async def create_organization(
    payload: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await require_platform_admin(db, user.id)
    initial_user = await db.get(User, payload.initial_admin_user_id)
    if initial_user is None or not initial_user.is_active:
        raise HTTPException(status_code=404, detail="Initial admin must be an active provisioned user.")

    org = Organization(
        name=payload.name.strip(),
        slug=payload.slug.lower(),
        domain=payload.domain.lower() if payload.domain else None,
    )
    db.add(org)
    try:
        await db.flush()
        db.add(OrganizationMember(organization_id=org.id, user_id=initial_user.id, role="org_admin"))
        db.add(OrganizationSettings(organization_id=org.id, config={
            "departments": [{"name": name, "enabled": True} for name in [
                "CEO", "HR", "Accounts", "Development", "Manager", "Executive", "Marketing"
            ]],
            "roles": [
                {"name": "HR", "enabled": True, "permissions": ["employees:read", "employees:manage", "attendance:manage"]},
                {"name": "Accounts", "enabled": True, "permissions": ["employees:read"]},
                {"name": "Manager", "enabled": True, "permissions": ["employees:read", "projects:create", "projects:manage", "tickets:assign", "requests:approve"]},
                {"name": "Employee", "enabled": True, "permissions": ["projects:create"]},
            ],
            "features": {
                "projects": True, "attendance": True, "planner": True,
                "documents": True, "posts": True, "ai_assistant": True,
            },
            "priorities": ["low", "normal", "high", "urgent"],
            "inbox_retention_days": 15,
            "audit_retention_years": 1,
            "employee_id_format": "{company}-{department}-{number}",
            "legal_name_approvers": ["HR"],
        }))
        db.add(OrganizationAdminLog(
            organization_id=org.id,
            actor_user_id=user.id,
            action="organization.created",
            details={"initial_admin_user_id": str(initial_user.id), "slug": org.slug},
        ))
        await db.commit()
        await db.refresh(org)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Organization slug or domain already exists.") from exc
    return org


@router.patch("/organizations/{org_id}", response_model=OrganizationRead)
async def update_organization(
    org_id: uuid.UUID,
    payload: PlatformOrganizationUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await require_platform_admin(db, user.id)
    org = await db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found.")

    changes = payload.model_dump(exclude_unset=True)
    allowed_statuses = {"trial", "active", "past_due", "suspended", "cancelled"}
    if changes.get("subscription_status") not in (None, *allowed_statuses):
        raise HTTPException(status_code=422, detail="Unsupported subscription status.")

    for field, value in changes.items():
        if field == "domain" and value:
            value = value.strip().lower()
        setattr(org, field, value)

    db.add(OrganizationAdminLog(
        organization_id=org.id,
        actor_user_id=user.id,
        action="subscription.updated",
        details=changes,
    ))
    try:
        await db.commit()
        await db.refresh(org)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Domain is already assigned to another organization.") from exc
    return org

