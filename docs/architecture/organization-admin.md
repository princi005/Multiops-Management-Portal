# Organization and Platform Admin Workflow

1. Provision a trusted platform operator in `platform_admins` using the controlled database bootstrap procedure.
2. Ensure the initial Organization Admin has an active account in `users`.
3. Create the organization from the Super Admin screen. This creates the organization, its initial settings, and the first `organization_members` row with role `org_admin`.
4. Add other already-provisioned accounts from Organization Admin using their user UUID and an organization-scoped role label.
5. Review organization admin changes in the organization audit view.
6. Update plan, domain, subscription status, and site activation from Super Admin.

Current limitations:
- Membership creation does not provision Supabase Auth accounts.
- Role labels are stored in organization memberships, but existing business API permissions still use the legacy global roles.
- Existing employee, department, project, ticket, payroll, and notification rows are not yet organization-scoped. Do not onboard multiple client organizations onto shared business data until that migration and its authorization checks are completed.
- Subscription status is administrative metadata only; billing collection and domain provisioning are not implemented here.


## Current subscription and membership behavior (2026-11-26)

Organization Admin can set the organization's subscription rate amount, currency, and period. Super Admin can review organization subscription metadata, active member counts, organization-admin details, and organization-admin audit events through platform APIs.

Membership APIs add already-provisioned users; they do not create Supabase Auth accounts. Subscription fields are administrative records; payment collection is not implemented. Organization scoping and authorization remain partial across the application's business data. Verify each route and model before assuming shared data is isolated.