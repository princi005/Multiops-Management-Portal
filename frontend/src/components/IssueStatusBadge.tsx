import type { IssueStatus } from "../types/issue";

const STYLES: Record<IssueStatus, string> = {
  open: "bg-amber-50 text-amber-700",
  in_progress: "bg-sky-50 text-sky-700",
  resolved: "bg-emerald-50 text-emerald-700",
  withdrawn: "bg-slate-100 text-slate-600",
};

export default function IssueStatusBadge({ status }: { status: IssueStatus }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STYLES[status]}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}