\# Database Schema (Phase 1)



\## Entities

users Supabase Auth UUID as primary key, email, full\_name, is\_active

roles e.g. CEO, HR (more added later, no schema change needed)

permissions Fine-grained actions, e.g. "employee:read"

role\_permissions Many-to-many: role <-> permission

user\_roles Many-to-many: user <-> role

departments name, description

employees Linked 1:1 to users, department (nullable FK), status Enum







\## Relationships

User --(user\_roles)-- Role --(role\_permissions)-- Permission

User --1:1 (optional)-- Employee --M:1-- Department







\## Design Notes



\- Full permission tables exist from day one (not a `role` string column)

&#x20; so per-permission checks can be added later without a migration —

&#x20; Phase 1 endpoints mostly check by role since only CEO/HR exist.

\- `Employee.employment\_status` uses a Python enum

&#x20; (`active`/`on\_leave`/`inactive`/`terminated`) mapped to a Postgres enum

&#x20; type. Deactivation is a soft-delete (status change), not a row delete,

&#x20; to preserve history for future knowledge-continuity features.

\- `Department` deletion sets `Employee.department\_id` to NULL

&#x20; (`ondelete="SET NULL"`) rather than cascading deletes to employees.



\## Migrations



Managed via Alembic (`backend/alembic/`). Run with:

```powershell

alembic upgrade head          # apply all migrations

alembic revision --autogenerate -m "description"   # create new one

```



Note: Alembic uses `psycopg2` (sync) for migrations even though the live

app uses `asyncpg` (async) — see `backend/alembic/env.py` for the

connection string adjustment this requires.



\## Future Entities (not yet implemented)



projects, project\_members, tasks, tickets, documents, document\_versions,

requirements, architecture\_decisions, repositories, code\_references,

knowledge\_risks — per the full product roadmap.





## Current schema and migration state (2026-11-26)

The Phase 1 entity list and “Future Entities” list above are historical and incomplete. The current SQLAlchemy models and Alembic migrations define the schema. Current model areas include users and roles, organizations and memberships, departments and employees, employee profile details and identity documents, employee assets and issues, employee requests and profile-change evidence, projects and tickets, payroll, notifications, and general-ledger records.

Migrations are managed in `backend/alembic/versions/`. The reported database revision and repository head were both `e2f4a91c7b60`. Check them again after pulling new migrations. Apply migrations from the backend environment with `.\venv\Scripts\python.exe -m alembic upgrade head`.

A migration head confirms Alembic revision state; it does not prove every table has organization-level isolation or that every application workflow works.