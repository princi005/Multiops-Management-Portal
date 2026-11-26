import { CheckCheck, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import AppButton from "../../../components/ui/AppButton";
import type { NotificationItem } from "../../../types/notification";
import { categoryForKind, categoryLabel } from "./inboxUtils";

export default function InboxDetailPanel({
  item,
  workLink,
  onMarkRead,
  markReadPending,
}: {
  item: NotificationItem | null;
  workLink: string;
  onMarkRead: (item: NotificationItem) => void;
  markReadPending: boolean;
}) {
  if (!item) {
    return (
      <div className="flex min-h-64 items-center justify-center p-8 text-center text-sm text-slate-500">
        Select a notification to see its details.
      </div>
    );
  }

  return (
    <article className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">
          {categoryLabel(categoryForKind(item.kind))}
        </span>
        {!item.read_at && (
          <AppButton type="button" variant="secondary" disabled={markReadPending} onClick={() => onMarkRead(item)}>
            <CheckCheck className="h-4 w-4" />Mark read
          </AppButton>
        )}
      </div>
      <h2 className="mt-5 text-xl font-extrabold">{item.title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.message}</p>
      <p className="mt-5 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>

      {(item.related_project_id || item.related_ticket_id) && (
        <div className="mt-6 rounded-xl border p-4" style={{ borderColor: "var(--mo-border)" }}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Related work</p>
          {item.related_project_id && <p className="mt-2 text-sm">Project reference: {item.related_project_id}</p>}
          {item.related_ticket_id && <p className="mt-1 text-sm">Ticket reference: {item.related_ticket_id}</p>}
          <Link to={workLink} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-violet-700 hover:underline">
            Open projects <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      )}
    </article>
  );
}
