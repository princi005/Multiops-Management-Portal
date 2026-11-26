# Tenant Isolation Status

Organization identity and membership exist, and the API can validate a selected
organization using `X-Organization-Id`.

The following existing business tables and services are still global and must
not be treated as tenant-isolated yet:

- employees and departments
- projects, tickets, project members, and notifications
- payroll profiles and salary history
- accounting records and audit logs

Next backend work must add `organization_id` to tenant-owned rows, backfill
existing rows to a deliberate legacy organization, enforce membership in every
read/write path, and add database constraints or row-level security as
appropriate. Do not rely on frontend filtering for isolation.


## Verified partial status (2026-11-26)

The blanket status above is outdated: organization scoping has been added for departments, employee requests, profile-change requests/evidence, identity documents, and employee assets in the current models, services, routes, and migrations.

Do not interpret this as full tenant isolation. Verify every business table and every read/write path before relying on isolation. In particular, project/ticket, payroll, accounting, employee, and notification scoping must be checked against their current code and schema before being described as complete. Never use frontend filtering as the security boundary.