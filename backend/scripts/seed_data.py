"""
Idempotent seed script — safe to run multiple times.
Creates roles, permissions, role-permission links, a starter Chart of
Accounts + one open financial period, a skills catalog, and test
accounts: CEO, HR, Accounts, Manager, Employee.

Run with: python -m scripts.seed_data   (from backend\\, venv active)
"""

import asyncio
import uuid
from datetime import date

from supabase import create_client
from sqlalchemy import select

from app.core.config import get_settings
from app.db.session import AsyncSessionLocal
from app.models.department import Department
from app.models.employee import Employee, EmploymentStatus
from app.models.financial_period import FinancialPeriod, PeriodStatus
from app.models.gl_account import AccountType, GLAccount
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.skill import Skill
from app.models.user import User
from app.models.user_role import UserRole

settings = get_settings()

# --- Test accounts ---
TEST_ACCOUNTS = [
    {"email": "ceo.test@example.com", "password": "CeoTest123!", "full_name": "Test CEO", "role": "CEO"},
    {"email": "hr.test@example.com", "password": "HrTest123!", "full_name": "Test HR", "role": "HR"},
    {"email": "accounts.test@example.com", "password": "AccountsTest123!", "full_name": "Test Accounts", "role": "Accounts"},
    {"email": "manager.test@example.com", "password": "ManagerTest123!", "full_name": "Test Manager", "role": "Manager"},
    {"email": "employee.test@example.com", "password": "EmployeeTest123!", "full_name": "Test Employee", "role": "Employee"},
]

PERMISSIONS = [
    ("employee:read", "View employee records"),
    ("employee:write", "Create/edit employee records"),
    ("dashboard:ceo:view", "View CEO dashboard"),
    ("dashboard:hr:view", "View HR dashboard"),
    ("gl:coa:read", "View chart of accounts"),
    ("gl:coa:write", "Create/edit chart of accounts"),
    ("gl:period:read", "View financial periods"),
    ("gl:period:manage", "Create/close financial periods"),
    ("gl:party:read", "View customers and vendors"),
    ("gl:party:write", "Create/edit customers and vendors"),
    ("employee_request:create", "Submit employee creation/exit requests"),
    ("employee_request:decide", "Approve/reject employee requests"),
    ("payroll:read", "View payroll profiles and salary history"),
    ("payroll:write", "Create/edit payroll profiles"),
    ("rbac:read", "View roles and permissions"),
    ("rbac:propose", "Propose changes to the permission grid"),
    ("rbac:decide", "Approve/reject proposed permission changes (CEO only)"),
]

ROLE_PERMISSIONS = {
    "CEO": [
        "dashboard:ceo:view",
        "employee:read",
        "gl:coa:read",
        "gl:period:read",
        "rbac:read",
        "rbac:decide",
    ],
    "HR": ["dashboard:hr:view", "employee:read", "employee:write", "employee_request:create"],
    "Accounts": [
        "gl:coa:read",
        "gl:coa:write",
        "gl:period:read",
        "gl:period:manage",
        "employee_request:decide",
        "gl:party:read",
        "gl:party:write",
        "payroll:read",
        "payroll:write",
    ],
    "SuperAdmin": ["rbac:read", "rbac:propose"],
}

DEFAULT_ACCOUNTS = [
    ("1000", "Assets", AccountType.ASSET, None),
    ("1010", "Cash", AccountType.ASSET, "1000"),
    ("1020", "Bank", AccountType.ASSET, "1000"),
    ("1200", "Accounts Receivable", AccountType.ASSET, "1000"),
    ("2000", "Liabilities", AccountType.LIABILITY, None),
    ("2010", "Accounts Payable", AccountType.LIABILITY, "2000"),
    ("3000", "Equity", AccountType.EQUITY, None),
    ("3010", "Owner's Equity", AccountType.EQUITY, "3000"),
    ("4000", "Income", AccountType.INCOME, None),
    ("4010", "Sales Revenue", AccountType.INCOME, "4000"),
    ("5000", "Expenses", AccountType.EXPENSE, None),
    ("5010", "Salaries Expense", AccountType.EXPENSE, "5000"),
    ("5020", "Office Expenses", AccountType.EXPENSE, "5000"),
]

DEFAULT_SKILLS = ["Python", "FastAPI", "React", "PostgreSQL", "Project Management"]


def get_or_create_auth_user(admin_client, email: str, password: str) -> str:
    existing = admin_client.auth.admin.list_users()
    for u in existing:
        if u.email == email:
            print(f"  Auth user already exists: {email}")
            return u.id

    created = admin_client.auth.admin.create_user({"email": email, "password": password, "email_confirm": True})
    print(f"  Created auth user: {email}")
    return created.user.id


async def seed_default_gl_accounts(db):
    code_to_id: dict[str, uuid.UUID] = {}
    for code, name, account_type, parent_code in DEFAULT_ACCOUNTS:
        result = await db.execute(select(GLAccount).where(GLAccount.code == code))
        existing = result.scalar_one_or_none()
        if existing is not None:
            code_to_id[code] = existing.id
            continue

        new_id = uuid.uuid4()
        db.add(
            GLAccount(
                id=new_id,
                code=code,
                name=name,
                account_type=account_type,
                parent_account_id=code_to_id.get(parent_code) if parent_code else None,
            )
        )
        await db.flush()
        code_to_id[code] = new_id
        print(f"Created GL account: {code} {name}")


async def seed_default_financial_period(db):
    result = await db.execute(select(FinancialPeriod).where(FinancialPeriod.name == "FY2026-27"))
    if result.scalar_one_or_none() is not None:
        print("Financial period FY2026-27 already exists")
        return

    db.add(
        FinancialPeriod(
            id=uuid.uuid4(),
            name="FY2026-27",
            start_date=date(2026, 4, 1),
            end_date=date(2027, 3, 31),
            status=PeriodStatus.OPEN,
        )
    )
    print("Created financial period: FY2026-27")


async def seed_default_skills(db):
    for name in DEFAULT_SKILLS:
        result = await db.execute(select(Skill).where(Skill.name == name))
        if result.scalar_one_or_none() is None:
            db.add(Skill(id=uuid.uuid4(), name=name))
            print(f"Created skill: {name}")


async def seed():
    admin_client = create_client(settings.supabase_url, settings.supabase_service_role_key)

    async with AsyncSessionLocal() as db:
        # --- Roles ---
        role_objs: dict[str, Role] = {}
        for role_name in ("CEO", "HR", "Accounts", "Employee", "Manager", "Admin", "SuperAdmin"):
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
                    db.add(RolePermission(role_id=role_objs[role_name].id, permission_id=perm_objs[code].id))
                    print(f"Linked {role_name} -> {code}")
        await db.flush()

        # --- Departments ---
        result = await db.execute(select(Department).where(Department.name == "Executive"))
        dept = result.scalar_one_or_none()
        if dept is None:
            dept = Department(id=uuid.uuid4(), name="Executive", description="Leadership & administration")
            db.add(dept)
            await db.flush()
            print("Created department: Executive")

        # --- Test accounts ---
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
                select(UserRole).where(UserRole.user_id == user.id, UserRole.role_id == role_objs[account["role"]].id)
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

        await seed_default_gl_accounts(db)
        await seed_default_financial_period(db)
        await seed_default_skills(db)

        await db.commit()
        print("\nSeed complete.")


if __name__ == "__main__":
    asyncio.run(seed())