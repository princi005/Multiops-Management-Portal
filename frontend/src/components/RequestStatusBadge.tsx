import type { RequestStatus } from "../types/employeeRequest";

const STYLES: Record<RequestStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

export default function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STYLES[status]}`}>
      {status}
    </span>
  );
}