import type { ProjectStatus } from "../../types/project";
import { statusLabel } from "../../lib/projectFormat";

const STYLES: Record<ProjectStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  on_hold: "bg-amber-50 text-amber-700",
  completed: "bg-sky-50 text-sky-700",
  archived: "bg-slate-100 text-slate-600",
};

export default function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STYLES[status]}`}>
      {statusLabel(status)}
    </span>
  );
}