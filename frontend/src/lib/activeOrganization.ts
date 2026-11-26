const STORAGE_KEY = "multiops-active-organization";

export function getActiveOrganizationId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setActiveOrganizationId(organizationId: string): void {
  localStorage.setItem(STORAGE_KEY, organizationId);
}

export function clearActiveOrganizationId(): void {
  localStorage.removeItem(STORAGE_KEY);
}
