\# API Endpoints (Phase 1)



Full interactive docs always available at `/docs` (Swagger) and `/redoc`

when the backend is running.



\## Health



| Method | Path | Access |

|---|---|---|

| GET | /hello | Public |

| GET | /health | Public (confirms DB connectivity too) |



\## Auth



| Method | Path | Access |

|---|---|---|

| GET | /auth/me | Any authenticated user |



\## Departments



| Method | Path | Access |

|---|---|---|

| GET | /departments | CEO, HR |

| POST | /departments | HR only |



\## Employees



| Method | Path | Access |

|---|---|---|

| GET | /employees | CEO, HR |

| GET | /employees/{id} | CEO, HR |

| POST | /employees | HR only (requires existing user\_id) |

| POST | /employees/onboard | HR only (creates Auth account + employee together) |

| PATCH | /employees/{id} | HR only |

| DELETE | /employees/{id} | HR only (soft-delete: sets status to inactive) |



\## Dashboard



| Method | Path | Access |

|---|---|---|

| GET | /dashboard/ceo | CEO only |



\## Authentication for All Protected Routes

Authorization: Bearer <supabase\_access\_token>



Obtained via Supabase Auth (`supabase.auth.signInWithPassword` on the

frontend, or the `/auth/v1/token?grant\_type=password` REST endpoint

directly for testing).







## Current API surface (2026-11-26)

The original Phase 1 list above is incomplete. The backend also registers APIs for organization and platform administration, employee profile and identity documents, profile-change requests and evidence, employee assets and asset requests, employee issues, projects and tickets, payroll, notifications, skills, and general-ledger records.

For the complete current paths, methods, schemas, and interactive requests, use the running backend's `/openapi.json`, `/docs`, or `/redoc`. Router source is under `backend/app/api/routes/`. Access requirements are enforced by route dependencies and services; do not infer that a route is public from this summary.