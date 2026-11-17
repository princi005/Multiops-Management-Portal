import type { ChangeStatus } from "../types/profileChange";

const STYLES: Record<ChangeStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};

export default function ChangeStatusBadge({ status }: { status: ChangeStatus }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STYLES[status]}`}>
      {status}
    </span>
  );
}