\# ADR 001: Supabase Auth for Authentication + Custom RBAC Tables for Authorization



\## Status

Accepted (Week 1)



\## Context

The platform needs authentication (who is this user) and authorization

(what can they do), across 8 eventual roles/portals. Two options were

considered: (A) Supabase Auth + our own permission tables, or (B) a

fully custom auth system (own users table, bcrypt, self-issued JWTs).



\## Decision

Option A. Supabase Auth handles authentication only. Our own

`roles`/`permissions`/`role\_permissions`/`user\_roles` tables handle

authorization entirely.



\## Reasoning

\- Zero-budget constraint: Supabase Auth is free, avoids building and

&#x20; securing password reset/email verification/token refresh ourselves.

\- Avoids "two competing auth systems," which the original project

&#x20; requirements explicitly warned against.

\- A `role` string column on `users` cannot express fine-grained

&#x20; permission differences (e.g. "HR can read but not delete employees")

&#x20; without a schema change later — full permission tables can, from day

&#x20; one, even though Phase 1 only checks by role.



\## Consequences

\- JWT verification requires fetching Supabase's public JWKS (asymmetric

&#x20; ES256/RS256 keys), not a static shared secret — more setup complexity

&#x20; than a self-issued JWT, but no secret to manage/rotate ourselves.

\- No public self-registration flow exists yet by design — accounts are

&#x20; provisioned by HR (`POST /employees/onboard`) or a seed script.

