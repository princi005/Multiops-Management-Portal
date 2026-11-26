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
