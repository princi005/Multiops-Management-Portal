# Organization Administration API

All endpoints require a valid Supabase-authenticated bearer token.

## Organization membership
- `GET /organizations/mine` — list the caller's active organization memberships.
- `GET /organizations/{org_id}/members` — Organization Admin only.
- `POST /organizations/{org_id}/members` — add an already-provisioned user by UUID.
- `PATCH /organizations/{org_id}/members/{member_id}` — update member role or active status.

## Organization configuration and audit
- `GET /organizations/{org_id}/settings` — Organization Admin only.
- `PUT /organizations/{org_id}/settings` — save configurable defaults.
- `GET /organizations/{org_id}/audit` — latest 200 organization admin events.

## Platform operations
- `GET /platform/organizations` — Platform Admin only.
- `POST /platform/organizations` — create a client org and assign its first Organization Admin.
- `PATCH /platform/organizations/{org_id}` — update domain, site active state, plan, and subscription status.

Platform Admin access is provisioned out-of-band by an authorized database operator through
`docs/database/platform-admin-bootstrap.sql`. Never accept a platform-admin flag from the client.
