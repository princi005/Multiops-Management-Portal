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



