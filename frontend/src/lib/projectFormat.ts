import type { DirectoryEmployee } from "../types/project";

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

export function employeeLabel(employee: DirectoryEmployee | undefined): string {
  if (!employee) return "Unknown employee";
  return `${employee.full_name ?? employee.email} (${employee.employee_code})`;
}

export function statusLabel(value: string): string {
  return value.replace(/_/g, " ");
}