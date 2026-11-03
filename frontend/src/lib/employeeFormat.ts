import type { Employee } from "../types/employee";

const INACTIVE_STATUSES = new Set(["inactive", "terminated"]);

/** Active/on_leave employees first, inactive/terminated sink to the bottom. */
export function sortEmployees(employees: Employee[]): Employee[] {
  return [...employees].sort((a, b) => {
    const aInactive = INACTIVE_STATUSES.has(a.employment_status) ? 1 : 0;
    const bInactive = INACTIVE_STATUSES.has(b.employment_status) ? 1 : 0;
    if (aInactive !== bInactive) return aInactive - bInactive;
    return a.employee_code.localeCompare(b.employee_code);
  });
}