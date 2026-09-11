\# Company Knowledge \& Engineering Intelligence Platform



An internal company platform combining company/employee management, centralized

documentation, AI-powered knowledge assistance, and engineering intelligence

(RAG, GitHub/GitLab integration, requirement-to-code traceability, knowledge

continuity). See `docs/requirements/` for the full product vision.



\## Status: Phase 1 (Week 1) — Complete



\- FastAPI backend with async PostgreSQL (Supabase), SQLAlchemy, Alembic

\- Supabase Auth (JWKS-based JWT verification) + custom RBAC

\- Employee, Department, Dashboard APIs with role-based access control

\- React (TypeScript) frontend: CEO Portal, HR Portal, login, employee

&#x20; onboarding

\- Automated backend test suite (pytest)



\## Project Structure : 

backend/ FastAPI + SQLAlchemy + Alembic + Supabase Postgres

frontend/ React + TypeScript + Vite + Tailwind

docs/ Architecture, database, API, security, ADRs

scripts/ One-off utility scripts (DB connectivity test)





\## Setup



See \[`docs/architecture/setup.md`](docs/architecture/setup.md) for full

step-by-step instructions (prerequisites, environment variables, running

both servers, seeding test data).



\## Quick Start (assumes setup already done once)



\*\*Backend:\*\*

```powershell

cd backend

.\\venv\\Scripts\\Activate.ps1

uvicorn app.main:app --reload

```



\*\*Frontend:\*\*

```powershell

cd frontend

npm run dev

```



\*\*Tests:\*\*

```powershell

cd backend

pytest -v

```



\## Documentation Index



\- \[Architecture](docs/architecture/overview.md)

\- \[Database Design](docs/database/schema.md)

\- \[API Structure](docs/api/endpoints.md)

\- \[Authentication \& Authorization](docs/security/auth.md)

\- \[Setup Guide](docs/architecture/setup.md)

\- \[Architecture Decision Records](docs/adr/)

