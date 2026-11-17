import type { TicketStatus } from "../types/project";
import { statusLabel } from "../lib/projectFormat";

const STYLES: Record<TicketStatus, string> = {
  not_started: "bg-slate-100 text-slate-600",
  in_progress: "bg-sky-50 text-sky-700",
  for_review: "bg-violet-50 text-violet-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
  dropped: "bg-amber-50 text-amber-700",
};

export default function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STYLES[status]}`}>
      {statusLabel(status)}
    </span>
  );
}