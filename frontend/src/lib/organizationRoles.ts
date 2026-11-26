export const ORGANIZATION_ROLE_LABELS: Record<string, string> = {
  org_admin: "Organization Admin",
  hr: "HR",
  accounts: "Accounts",
  manager: "Manager",
  employee: "Employee",
};

export function organizationRoleLabel(role: string) {
  return ORGANIZATION_ROLE_LABELS[role] ?? role.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
