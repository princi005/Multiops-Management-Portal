"""Create local Organization Admin and Platform Admin test accounts.

Run from backend with the project virtual environment active:
    python -m scripts.seed_admin_accounts
"""
import asyncio
import uuid

from sqlalchemy import select
from supabase import create_client

from app.core.config import get_settings
from app.db.session import AsyncSessionLocal
from app.models.employee import Employee
from app.models.organization import (
    Organization,
    OrganizationMember,
    OrganizationSettings,
    PlatformAdmin,
)
from app.models.user import User

settings = get_settings()

ADMIN_TEST_ACCOUNTS = [
    {
        "email": "orgadmin.test@example.com",
        "password": "OrgAdminTest123!",
        "full_name": "Test Organization Admin",
        "platform_admin": False,
    },
    {
        "email": "superadmin.test@example.com",
        "password": "SuperAdminTest123!",
        "full_name": "Test Super Admin",
        "platform_admin": True,
    },
]

EXISTING_TEST_MEMBERS = [
    ("ceo.test@example.com", "ceo"),
    ("hr.test@example.com", "hr"),
    ("accounts.test@example.com", "accounts"),
    ("manager.test@example.com", "manager"),
    ("employee.test@example.com", "employee"),
]

DEFAULT_ORG_CONFIG = {
    "departments": [
        {"name": name, "enabled": True}
        for name in ["CEO", "HR", "Accounts", "Development", "Manager", "Executive", "Marketing"]
    ],
    "roles": [
        {"name": "HR", "enabled": True, "permissions": ["employees:read", "employees:manage"]},
        {"name": "Accounts", "enabled": True, "permissions": ["employees:read"]},
        {"name": "Manager", "enabled": True, "permissions": ["projects:create", "projects:manage", "tickets:assign"]},
        {"name": "Employee", "enabled": True, "permissions": ["projects:create"]},
    ],
    "features": {
        "projects": True,
        "attendance": True,
        "planner": True,
        "documents": True,
        "posts": True,
        "ai_assistant": True,
    },
    "priorities": ["low", "normal", "high", "urgent"],
    "inbox_retention_days": 15,
    "audit_retention_years": 1,
    "employee_id_format": "{company}-{department}-{number}",
    "legal_name_approvers": ["HR"],
}


def find_auth_user_id(admin_client, email: str) -> uuid.UUID | None:
    users = admin_client.auth.admin.list_users()
    for auth_user in users:
        if (auth_user.email or "").casefold() == email.casefold():
            return uuid.UUID(str(auth_user.id))
    return None


async def ensure_admin_user(db, admin_client, account: dict) -> User:
    auth_id = find_auth_user_id(admin_client, account["email"])
    if auth_id is None:
        created = admin_client.auth.admin.create_user({
            "email": account["email"],
            "password": account["password"],
            "email_confirm": True,
        })
        auth_id = uuid.UUID(str(created.user.id))

    user = await db.get(User, auth_id)
    if user is None:
        user = User(
            id=auth_id,
            email=account["email"],
            full_name=account["full_name"],
            is_active=True,
        )
        db.add(user)
        await db.flush()
    else:
        user.is_active = True
        user.full_name = account["full_name"]
    return user


async def seed_admin_accounts() -> None:
    admin_client = create_client(settings.supabase_url, settings.supabase_service_role_key)

    async with AsyncSessionLocal() as db:
        org_admin_user = await ensure_admin_user(db, admin_client, ADMIN_TEST_ACCOUNTS[0])
        platform_admin_user = await ensure_admin_user(db, admin_client, ADMIN_TEST_ACCOUNTS[1])

        result = await db.execute(
            select(Organization).where(Organization.slug == "multiops-demo")
        )
        organization = result.scalar_one_or_none()
        if organization is None:
            organization = Organization(
                name="MultiOps Demo",
                slug="multiops-demo",
                company_prefix="MTO",
                is_active=True,
                subscription_plan="trial",
                subscription_status="trial",
            )
            db.add(organization)
            await db.flush()

        employee_result = await db.execute(
            select(Employee).where(Employee.user_id == org_admin_user.id)
        )
        if employee_result.scalar_one_or_none() is None:
            employee_suffix = str(org_admin_user.id.int % 1_000_000).zfill(6)
            employee_code = f"{organization.company_prefix[:9]}-ADM-{employee_suffix}"
            code_result = await db.execute(
                select(Employee).where(Employee.employee_code == employee_code)
            )
            if code_result.scalar_one_or_none() is not None:
                raise RuntimeError(f"Employee ID already exists: {employee_code}")
            db.add(Employee(
                user_id=org_admin_user.id,
                employee_code=employee_code,
                designation="Organization Admin",
            ))

        settings_row = await db.get(OrganizationSettings, organization.id)
        if settings_row is None:
            db.add(OrganizationSettings(
                organization_id=organization.id,
                config=DEFAULT_ORG_CONFIG,
            ))
        else:
            settings_row.config = {**DEFAULT_ORG_CONFIG, **(settings_row.config or {})}

        member_accounts = [
            (org_admin_user, "org_admin"),
        ]
        for email, member_role in EXISTING_TEST_MEMBERS:
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            if user is None:
                print(f"Existing seeded account not found; skipped membership: {email}")
                continue
            member_accounts.append((user, member_role))

        for user, member_role in member_accounts:
            result = await db.execute(
                select(OrganizationMember).where(
                    OrganizationMember.organization_id == organization.id,
                    OrganizationMember.user_id == user.id,
                )
            )
            membership = result.scalar_one_or_none()
            if membership is None:
                db.add(OrganizationMember(
                    organization_id=organization.id,
                    user_id=user.id,
                    role=member_role,
                    is_active=True,
                ))
            else:
                membership.role = member_role
                membership.is_active = True

        platform_row = await db.get(PlatformAdmin, platform_admin_user.id)
        if platform_row is None:
            db.add(PlatformAdmin(user_id=platform_admin_user.id, is_active=True))
        else:
            platform_row.is_active = True

        await db.commit()

        print("\nDemo organization and admin accounts are ready.")
        print(f"Organization: {organization.name} ({organization.id})")
        print(f"Organization Admin email: {org_admin_user.email}")
        print(f"Organization Admin user ID: {org_admin_user.id}")
        print(f"Organization Admin password: {ADMIN_TEST_ACCOUNTS[0]['password']}")
        print(f"Super Admin email: {platform_admin_user.email}")
        print(f"Super Admin user ID: {platform_admin_user.id}")
        print(f"Super Admin password: {ADMIN_TEST_ACCOUNTS[1]['password']}")
        print("Manager/Employee memberships were added when those seeded accounts existed.")


if __name__ == "__main__":
    asyncio.run(seed_admin_accounts())

