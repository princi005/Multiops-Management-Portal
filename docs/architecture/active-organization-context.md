# Active Organization Context

The frontend stores the selected organization ID locally and sends it as
`X-Organization-Id` on authenticated API requests.

The backend dependency `get_current_organization` validates that the signed-in
user has an active membership in the selected, active organization. If the
header is omitted, the API resolves a single membership automatically and
returns `409` when the user belongs to multiple organizations.

This dependency must be added to each organization-owned business endpoint
before that endpoint can safely read or write tenant data. Merely sending the
header does not scope existing queries.


## Current implementation note (2026-11-26)

The dependency is used by a subset of organization-aware routes, including employee asset and profile-change/identity-document workflows. It is not yet applied to every business endpoint. The previous instruction above to add it to every endpoint describes required future work, not completed coverage.

Before adding or changing an organization-owned route, verify its authorization dependency, organization-scoped query predicates, and the corresponding model and migration. The frontend organization header alone is not an isolation control.