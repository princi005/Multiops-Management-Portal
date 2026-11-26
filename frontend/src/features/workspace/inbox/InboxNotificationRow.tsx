import { Bell, CheckCheck, ClipboardList, FolderKanban, MessageSquare, Megaphone } from "lucide-react";
import type { NotificationItem } from "../../../types/notification";
import { categoryForKind, categoryLabel } from "./inboxUtils";

function IconForKind({ kind }: { kind: string }) {
  const category = categoryForKind(kind);
  const className = "h-4 w-4";
  if (category === "projects") return <FolderKanban className={className} />;
  if (category === "requests") return <ClipboardList className={className} />;
  if (category === "comments") return <MessageSquare className={className} />;
  if (category === "announcements") return <Megaphone className={className} />;
  return <Bell className={className} />;
}

export default function InboxNotificationRow({
  item,
  selected,
  onSelect,
  onMarkRead,
}: {
  item: NotificationItem;
  selected: boolean;
  onSelect: () => void;
  onMarkRead: () => void;
}) {
  return (
    <article className={`flex gap-2 border-b p-3 last:border-b-0 ${selected ? "bg-violet-50/80" : "hover:bg-slate-50/80"}`}
      style={{ borderColor: "var(--mo-border)" }}>
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 gap-3 text-left">
        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.read_at ? "bg-slate-100 text-slate-500" : "bg-violet-100 text-violet-800"}`}>
          <IconForKind kind={item.kind} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-bold">{item.title}</span>
            {!item.read_at && <span className="h-2 w-2 rounded-full bg-violet-600" aria-label="Unread" />}
          </span>
          <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-600">{item.message}</span>
          <span className="mt-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {categoryLabel(categoryForKind(item.kind))} · {new Date(item.created_at).toLocaleString()}
          </span>
        </span>
      </button>
      {!item.read_at && (
        <button type="button" onClick={onMarkRead} aria-label={`Mark ${item.title} as read`}
          className="h-9 shrink-0 rounded-lg p-2 text-slate-500 hover:bg-white hover:text-violet-700">
          <CheckCheck className="h-4 w-4" />
        </button>
      )}
    </article>
  );
}
