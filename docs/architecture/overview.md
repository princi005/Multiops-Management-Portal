\# Architecture Overview



\## System Layers



React Frontend (Vite + TypeScript + Tailwind)

|

FastAPI Backend

|

Service / Business Logic Layer

|

SQLAlchemy ORM (async)

|

asyncpg

|

PostgreSQL (hosted on Supabase, via Session Pooler)





\## Authentication vs Authorization



Deliberately separated per the original architecture decision:



\- \*\*Authentication ("who is this user?")\*\* — Supabase Auth. The frontend

&#x20; signs in via `supabase-js`, receiving a Supabase-issued JWT (asymmetric

&#x20; ES256/RS256 signing, verified via JWKS — not a shared secret).

\- \*\*Authorization ("what can they do?")\*\* — our own `roles` /

&#x20; `permissions` / `role\_permissions` / `user\_roles` tables in Postgres,

&#x20; enforced via FastAPI dependencies (`require\_role`).



See \[ADR 001](../adr/001-supabase-auth-plus-custom-rbac.md) for the full

reasoning.



\## Backend Structure

backend/app/

main.py FastAPI app, router registration, CORS

core/

config.py Settings from .env (Pydantic)

security.py JWT verification via Supabase JWKS

permissions.py require\_role() dependency

supabase\_admin.py Service-role client (HR onboarding only)

db/

session.py Async SQLAlchemy engine/session

base.py Declarative base for models

models/ SQLAlchemy ORM models

schemas/ Pydantic request/response schemas

api/

deps.py get\_current\_user dependency

routes/ One file per resource (health, auth, employees, ...)

services/ Business logic, separate from routes

backend/tests/ pytest suite (httpx.AsyncClient, in-process)





\## Frontend Structure

frontend/src/

lib/ Supabase client, axios client (auto-attaches JWT)

store/ Zustand auth store

routes/ ProtectedRoute wrapper

components/ Shared UI: StatCard, PortalHeader, Loading/Error/EmptyState

features/

auth/ Login page, generic post-login placeholder

hr/ HR Portal: employee list, edit, onboarding

ceo/ CEO Portal: company dashboard

hooks/ React Query hooks per resource

types/ TypeScript types matching backend schemas




\## Zero-Budget Constraint



Per project requirements, current implementation uses only free-tier

services: Supabase Free/Pro, no paid AI API in the current phase (see

\[ADR 002](../adr/002-local-ai-for-zero-budget-execution.md) for the

planned Ollama-based approach for future AI features).

