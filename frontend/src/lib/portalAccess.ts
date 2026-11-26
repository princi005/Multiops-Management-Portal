import type { CurrentUser } from "../hooks/useCurrentUser";

export function canOpenOrganizationAdmin(user: CurrentUser | undefined) {
  return Boolean(user?.organization_roles.includes("org_admin"));
}

export function canOpenPlatformAdmin(user: CurrentUser | undefined) {
  return Boolean(user?.is_platform_admin);
}
