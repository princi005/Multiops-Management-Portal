import { Link } from "react-router-dom";
import { Clock3 } from "lucide-react";

export default function InboxRetentionNote({
  isOrganizationAdmin,
  days,
  isLoading,
}: {
  isOrganizationAdmin: boolean;
  days: number;
  isLoading: boolean;
}) {
  return (
    <aside className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 text-cyan-950">
      <div className="flex items-start gap-3">
        <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-800" />
        <div>
          <p className="text-sm font-bold">Notification retention</p>
          <p className="mt-1 text-xs leading-5">
            {isOrganizationAdmin
              ? `Configured retention: ${isLoading ? "loading…" : `${days} days`}.`
              : "The default is 15 days. Your Organization Admin controls the organization’s retention period."}
            {" "}Automatic deletion is a server workflow.
          </p>
        </div>
      </div>
      {isOrganizationAdmin && (
        <Link to="/admin/organization" className="rounded-lg border border-cyan-300 bg-white px-3 py-2 text-xs font-bold text-cyan-900 hover:bg-cyan-100">
          Organization settings
        </Link>
      )}
    </aside>
  );
}
