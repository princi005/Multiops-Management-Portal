import type { EmployeeRequest, RequestStatus } from "../types/employeeRequest";

export function requestTitle(request: EmployeeRequest): string {
  const p = request.payload;
  if (request.request_type === "creation") return String(p.full_name ?? "Unnamed request");
  return `Exit: ${String(p.employee_code ?? p.employee_id ?? "Unknown employee")}`;
}

export function describeRequest(request: EmployeeRequest): string {
  const p = request.payload;
  if (request.request_type === "creation") {
    return `${String(p.full_name ?? "")} (${String(p.email ?? "")}), code ${String(p.employee_code ?? "")}`;
  }
  const reason = p.reason ? `: ${String(p.reason)}` : "";
  return `Exit for ${String(p.employee_code ?? p.employee_id ?? "")}${reason}`;
}

const STATUS_RANK: Record<RequestStatus, number> = { pending: 0, approved: 1, rejected: 1 };

/** Pending requests first (newest first), resolved requests after (newest first). */
export function sortRequests(requests: EmployeeRequest[]): EmployeeRequest[] {
  return [...requests].sort((a, b) => {
    const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function filterRequests(
  requests: EmployeeRequest[],
  search: string,
  status: RequestStatus | "all"
): EmployeeRequest[] {
  const query = search.trim().toLowerCase();
  return requests.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (query === "") return true;
    return (requestTitle(r) + " " + describeRequest(r)).toLowerCase().includes(query);
  });
}