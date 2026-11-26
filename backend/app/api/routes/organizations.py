import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.api.tenant import get_current_organization
from app.db.session import get_db
from app.models.organization import Organization, OrganizationAdminLog, OrganizationMember, OrganizationSettings
from app.models.user import User
from app.schemas.organization import (
    MembershipRead,
    OrganizationAuditRead,
    OrganizationConfig,
    OrganizationMemberCreate,
    OrganizationMemberRead,
    OrganizationMemberUpdate,
)

router = APIRouter(prefix="/organizations", tags=["organizations"])

ALLOWED_ORG_PERMISSIONS = {
    "employees:read",
    "employees:manage",
    "departments:manage",
    "roles:manage",
    "projects:create",
    "projects:manage",
    "tickets:assign",
    "requests:approve",
    "attendance:manage",
    "documents:manage",
}


async def require_org_admin(db: AsyncSession, user_id: uuid.UUID, org_id: uuid.UUID) -> OrganizationMember:
    result = await db.execute(select(OrganizationMember).where(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == user_id,
        OrganizationMember.is_active.is_(True),
    ))
    membership = result.scalar_one_or_none()
    if membership is None or membership.role.casefold() != "org_admin":
        raise HTTPException(status_code=403, detail="Organization Admin permission required.")
    return membership


async def record_admin_action(
    db: AsyncSession,
    org_id: uuid.UUID,
    actor_id: uuid.UUID,
    action: str,
    details: dict,
) -> None:
    db.add(OrganizationAdminLog(
        organization_id=org_id,
        actor_user_id=actor_id,
        action=action,
        details=details,
    ))


async def configured_role(db: AsyncSession, org_id: uuid.UUID, requested_name: str) -> str:
    settings = await db.get(OrganizationSettings, org_id)
    roles = (settings.config if settings else {}).get("roles", [])
    requested = requested_name.strip().casefold()

    role = next(
        (
            item for item in roles
            if str(item.get("name", "")).strip().casefold() == requested
            and item.get("enabled", True)
        ),
        None,
    )
    if role is None:
        raise HTTPException(status_code=422, detail="Choose an enabled role configured by this organization.")
    canonical = str(role["name"]).strip()
    if canonical.casefold() in {"org_admin", "organization admin"}:
        raise HTTPException(status_code=422, detail="Organization Admin cannot be assigned through member management.")
    return canonical


@router.get("/mine", response_model=list[MembershipRead])
async def my_organizations(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(
        select(OrganizationMember, Organization)
        .join(Organization, Organization.id == OrganizationMember.organization_id)
        .where(OrganizationMember.user_id == user.id, OrganizationMember.is_active.is_(True))
        .order_by(Organization.name)
    )
    return [{"organization": org, "role": member.role} for member, org in result.all()]


@router.get("/{org_id}/settings", response_model=OrganizationConfig)
async def read_settings(
    org_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await require_org_admin(db, user.id, org_id)
    row = await db.get(OrganizationSettings, org_id)
    organization = await db.get(Organization, org_id)
    config = dict(row.config) if row and row.config else {}
    config["company_prefix"] = organization.company_prefix if organization else "MTO"
    return OrganizationConfig.model_validate(config)


@router.put("/{org_id}/settings", response_model=OrganizationConfig)
async def update_settings(
    org_id: uuid.UUID,
    payload: OrganizationConfig,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await require_org_admin(db, user.id, org_id)
    org = await db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found.")

    data = payload.model_dump()
    org.company_prefix = data["company_prefix"].strip().upper()
    data["company_prefix"] = org.company_prefix
    for key in ("departments", "roles"):
        names = [str(item.get("name", "")).strip().casefold() for item in data[key]]
        if any(not name for name in names) or len(names) != len(set(names)):
            raise HTTPException(status_code=422, detail=f"{key.title()} must have unique, non-empty names.")

    for role in data["roles"]:
        permissions = role.get("permissions", [])
        if not isinstance(permissions, list) or any(
            not isinstance(permission, str) or permission not in ALLOWED_ORG_PERMISSIONS
            for permission in permissions
        ):
            raise HTTPException(status_code=422, detail=f"Role '{role['name']}' contains an unsupported permission.")

    row = await db.get(OrganizationSettings, org_id)
    previous = row.config if row else {}
    if row is None:
        db.add(OrganizationSettings(organization_id=org_id, config=data))
    else:
        row.config = data

    await record_admin_action(
        db, org_id, user.id, "settings.updated", {"previous": previous, "updated": data}
    )
    await db.commit()
    return OrganizationConfig.model_validate(data)


@router.get("/{org_id}/members", response_model=list[OrganizationMemberRead])
async def list_members(
    org_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await require_org_admin(db, user.id, org_id)
    result = await db.execute(
        select(OrganizationMember, User)
        .join(User, User.id == OrganizationMember.user_id)
        .where(OrganizationMember.organization_id == org_id)
        .order_by(User.email)
    )
    return [
        {
            "id": member.id,
            "user_id": member.user_id,
            "email": target.email,
            "full_name": target.full_name,
            "role": member.role,
            "is_active": member.is_active,
            "created_at": member.created_at,
        }
        for member, target in result.all()
    ]


@router.post("/{org_id}/members", response_model=OrganizationMemberRead, status_code=201)
async def add_member(
    org_id: uuid.UUID,
    payload: OrganizationMemberCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await require_org_admin(db, user.id, org_id)
    target = await db.get(User, payload.user_id)
    if target is None or not target.is_active:
        raise HTTPException(status_code=404, detail="Active provisioned user not found.")

    role_name = await configured_role(db, org_id, payload.role)
    existing = await db.execute(select(OrganizationMember).where(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == payload.user_id,
    ))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="This user is already a member.")

    member = OrganizationMember(
        organization_id=org_id,
        user_id=payload.user_id,
        role=role_name,
        is_active=True,
    )
    db.add(member)
    await record_admin_action(
        db, org_id, user.id, "member.added", {"user_id": str(target.id), "role": role_name}
    )
    await db.commit()
    await db.refresh(member)
    return {
        "id": member.id,
        "user_id": target.id,
        "email": target.email,
        "full_name": target.full_name,
        "role": member.role,
        "is_active": member.is_active,
        "created_at": member.created_at,
    }


@router.patch("/{org_id}/members/{member_id}", response_model=OrganizationMemberRead)
async def update_member(
    org_id: uuid.UUID,
    member_id: uuid.UUID,
    payload: OrganizationMemberUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await require_org_admin(db, user.id, org_id)
    member = await db.get(OrganizationMember, member_id)
    if member is None or member.organization_id != org_id:
        raise HTTPException(status_code=404, detail="Organization member not found.")
    if member.role.casefold() == "org_admin":
        raise HTTPException(status_code=422, detail="Organization Admin membership cannot be changed here.")

    changes = payload.model_dump(exclude_unset=True)
    if "role" in changes and changes["role"] is not None:
        changes["role"] = await configured_role(db, org_id, changes["role"])
    for field, value in changes.items():
        setattr(member, field, value)

    target = await db.get(User, member.user_id)
    await record_admin_action(
        db, org_id, user.id, "member.updated",
        {"member_id": str(member.id), "changes": changes},
    )
    await db.commit()
    await db.refresh(member)
    return {
        "id": member.id,
        "user_id": target.id,
        "email": target.email,
        "full_name": target.full_name,
        "role": member.role,
        "is_active": member.is_active,
        "created_at": member.created_at,
    }


@router.get("/{org_id}/audit", response_model=list[OrganizationAuditRead])
async def organization_audit(
    org_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await require_org_admin(db, user.id, org_id)
    result = await db.execute(
        select(OrganizationAdminLog)
        .where(OrganizationAdminLog.organization_id == org_id)
        .order_by(OrganizationAdminLog.created_at.desc())
        .limit(200)
    )
    return result.scalars().all()


@router.get("/active", response_model=MembershipRead)
async def active_organization(
    active: tuple[Organization, OrganizationMember] = Depends(get_current_organization),
):
    organization, membership = active
    return {"organization": organization, "role": membership.role}

