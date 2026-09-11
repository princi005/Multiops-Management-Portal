"""
Idempotent seed script — safe to run multiple times.
Creates:
  - Roles: CEO, HR
  - Permissions: a starter set for employee/dashboard access
  - Role-Permission links
  - Two Supabase Auth users (CEO, HR) + matching app-side rows

Run with: python scripts\\seed_data.py   (from backend\\, venv active)
"""

import asyncio
import uuid

from supabase import create_client
from sqlalchemy import select

from app.core.config import get_settings
from app.db.session import AsyncSessionLocal
from app.models.department import Department
from app.models.employee import Employee, EmploymentStatus
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.user import User
from app.models.user_role import UserRole

settings = get_settings()

# --- Test accounts (change these before running if you like) ---
TEST_ACCOUNTS = [
    {"email": "ceo.test@example.com", "password": "CeoTest123!", "full_name": "Test CEO", "role": "CEO"},
    {"email": "hr.test@example.com", "password": "HrTest123!", "full_name": "Test HR", "role": "HR"},
]

PERMISSIONS = [
    ("employee:read", "View employee records"),
    ("employee:write", "Create/edit employee records"),
    ("dashboard:ceo:view", "View CEO dashboard"),
    ("dashboard:hr:view", "View HR dashboard"),
]

ROLE_PERMISSIONS = {
    "CEO": ["dashboard:ceo:view", "employee:read"],
    "HR": ["dashboard:hr:view", "employee:read", "employee:write"],
}


def get_or_create_auth_user(admin_client, email: str, password: str) -> str:
    """Creates the Supabase Auth user if missing, returns their UUID either way."""
    existing = admin_client.auth.admin.list_users()
    for u in existing:
        if u.email == email:
            print(f"  Auth user already exists: {email}")
            return u.id

    created = admin_client.auth.admin.create_user(
        {"email": email, "password": password, "email_confirm": True}
    )
    print(f"  Created auth user: {email}")
    return created.user.id


async def seed():
    admin_client = create_client(settings.supabase_url, settings.supabase_service_role_key)

    async with AsyncSessionLocal() as db:
        # --- Roles ---
        role_objs: dict[str, Role] = {}
        for role_name in ("CEO", "HR"):
            result = await db.execute(select(Role).where(Role.name == role_name))
            role = result.scalar_one_or_none()
            if role is None:
                role = Role(id=uuid.uuid4(), name=role_name)
                db.add(role)
                print(f"Created role: {role_name}")
            role_objs[role_name] = role
        await db.flush()

        # --- Permissions ---
        perm_objs: dict[str, Permission] = {}
        for code, description in PERMISSIONS:
            result = await db.execute(select(Permission).where(Permission.code == code))
            perm = result.scalar_one_or_none()
            if perm is None:
                perm = Permission(id=uuid.uuid4(), code=code, description=description)
                db.add(perm)
                print(f"Created permission: {code}")
            perm_objs[code] = perm
        await db.flush()

        # --- Role-Permission links ---
        for role_name, codes in ROLE_PERMISSIONS.items():
            for code in codes:
                result = await db.execute(
                    select(RolePermission).where(
                        RolePermission.role_id == role_objs[role_name].id,
                        RolePermission.permission_id == perm_objs[code].id,
                    )
                )
                if result.scalar_one_or_none() is None:
                    db.add(
                        RolePermission(
                            role_id=role_objs[role_name].id,
                            permission_id=perm_objs[code].id,
                        )
                    )
                    print(f"Linked {role_name} -> {code}")
        await db.flush()

        # --- Departments (needed for Employee rows) ---
        result = await db.execute(select(Department).where(Department.name == "Executive"))
        dept = result.scalar_one_or_none()
        if dept is None:
            dept = Department(id=uuid.uuid4(), name="Executive", description="Leadership & administration")
            db.add(dept)
            await db.flush()
            print("Created department: Executive")

        # --- Test accounts: Auth user + users row + user_role + employee ---
        for account in TEST_ACCOUNTS:
            print(f"\nProvisioning {account['email']} ({account['role']})...")

            auth_user_id = get_or_create_auth_user(admin_client, account["email"], account["password"])
            user_uuid = uuid.UUID(auth_user_id)

            result = await db.execute(select(User).where(User.id == user_uuid))
            user = result.scalar_one_or_none()
            if user is None:
                user = User(id=user_uuid, email=account["email"], full_name=account["full_name"], is_active=True)
                db.add(user)
                await db.flush()
                print(f"  Created users row for {account['email']}")

            result = await db.execute(
                select(UserRole).where(
                    UserRole.user_id == user.id,
                    UserRole.role_id == role_objs[account["role"]].id,
                )
            )
            if result.scalar_one_or_none() is None:
                db.add(UserRole(user_id=user.id, role_id=role_objs[account["role"]].id))
                print(f"  Assigned role {account['role']}")

            result = await db.execute(select(Employee).where(Employee.user_id == user.id))
            if result.scalar_one_or_none() is None:
                db.add(
                    Employee(
                        id=uuid.uuid4(),
                        user_id=user.id,
                        department_id=dept.id,
                        employee_code=f"EMP-{account['role']}-001",
                        designation=account["role"],
                        employment_status=EmploymentStatus.ACTIVE,
                    )
                )
                print(f"  Created employee record for {account['email']}")

        await db.commit()
        print("\nSeed complete.")


if __name__ == "__main__":
    asyncio.run(seed())