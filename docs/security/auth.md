\# Authentication \& Authorization



\## Flow



1\. User signs in via `supabase-js` on the frontend.

2\. Supabase issues a JWT, asymmetrically signed (ES256/RS256) —

&#x20;  this is Supabase's default for projects created since May 2025.

3\. Frontend attaches the JWT as `Authorization: Bearer <token>` on

&#x20;  every API call (`frontend/src/lib/apiClient.ts`, axios interceptor).

4\. FastAPI's `get\_current\_user` dependency (`backend/app/api/deps.py`)

&#x20;  verifies the JWT signature against Supabase's public JWKS endpoint

&#x20;  (fetched and cached via `PyJWKClient`, not a static shared secret),

&#x20;  then loads the matching `users` row (with roles) from Postgres.

5\. Route-level `require\_role(...)` dependencies

&#x20;  (`backend/app/core/permissions.py`) gate access per-endpoint.



\## Why This Split



Authentication and authorization are deliberately two separate systems:

Supabase owns "who is this user," our own Postgres tables own "what can

they do." See \[ADR 001](../adr/001-supabase-auth-plus-custom-rbac.md).



\## Provisioning



No public self-registration endpoint exists. Accounts are created by:

\- `backend/scripts/seed\_data.py` — initial CEO/HR test accounts

&#x20; (idempotent, safe to re-run)

\- `POST /employees/onboard` — HR-initiated onboarding of new hires,

&#x20; using the same service\_role-key pattern as the seed script



\## Secrets Handling



\- `SUPABASE\_SERVICE\_ROLE\_KEY` (backend only, `.env`) — bypasses Row

&#x20; Level Security, used only for account creation, never exposed to

&#x20; the frontend or any public endpoint.

\- `SUPABASE\_ANON\_KEY` — safe for frontend use by design (restricted by

&#x20; Row Level Security on Supabase's side).

\- All secrets excluded from Git via `.gitignore`; `.env.example` files

&#x20; contain placeholders only.



## Current organization authorization note (2026-11-26)

The project has both legacy global role checks and organization-membership role checks. Organization membership is enforced on routes that depend on the active organization, but organization-aware authorization is not yet universal. Review route dependencies and service queries when changing access rules; a valid Supabase token alone does not grant access to organization data.

Platform Admin membership is provisioned out-of-band. Never accept platform privileges or organization identity supplied only by the client.