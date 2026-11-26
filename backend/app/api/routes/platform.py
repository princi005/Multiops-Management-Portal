import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
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
from app.schemas.platform import PlatformAuditRead, PlatformOrganizationRead, PlatformOrganizationUpdate

router = APIRouter(prefix="/platform", tags=["platform-admin"])


async def require_platform_admin(db: AsyncSession, user_id: uuid.UUID) -> None:
    row = await db.get(PlatformAdmin, user_id)
    if row is None or not row.is_active:
        raise HTTPException(status_code=403, detail="Platform Admin access required.")


@router.get("/organizations", response_model=list[PlatformOrganizationRead])
async def list_organizations(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    await require_platform_admin(db, user.id)

    organizations_result = await db.execute(select(Organization).order_by(Organization.created_at.desc()))
    organizations = organizations_result.scalars().all()

    counts_result = await db.execute(
        select(OrganizationMember.organization_id, func.count(OrganizationMember.id))
        .where(OrganizationMember.is_active.is_(True))
        .group_by(OrganizationMember.organization_id)
    )
    active_user_counts = dict(counts_result.all())

    admins_result = await db.execute(
        select(
            OrganizationMember.organization_id,
            User.id,
            User.email,
            User.full_name,
        )
        .join(User, User.id == OrganizationMember.user_id)
        .where(
            OrganizationMember.is_active.is_(True),
            func.lower(OrganizationMember.role) == "org_admin",
        )
    )
    admins_by_organization: dict[uuid.UUID, list[dict]] = {}
    for organization_id, admin_id, email, full_name in admins_result.all():
        admins_by_organization.setdefault(organization_id, []).append({
            "user_id": admin_id,
            "email": email,
            "full_name": full_name,
        })

    return [
        {
            "id": organization.id,
            "name": organization.name,
            "slug": organization.slug,
            "domain": organization.domain,
            "company_prefix": organization.company_prefix,
            "is_active": organization.is_active,
            "subscription_plan": organization.subscription_plan,
            "subscription_status": organization.subscription_status,
            "subscription_reference": organization.subscription_reference,
            "subscription_expires_at": organization.subscription_expires_at,
            "subscription_renews_at": organization.subscription_renews_at,
            "subscription_rate_amount": organization.subscription_rate_amount,
            "subscription_rate_currency": organization.subscription_rate_currency,
            "subscription_rate_period": organization.subscription_rate_period,
            "active_user_count": active_user_counts.get(organization.id, 0),
            "organization_admins": admins_by_organization.get(organization.id, []),
            "created_at": organization.created_at,
        }
        for organization in organizations
    ]


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

