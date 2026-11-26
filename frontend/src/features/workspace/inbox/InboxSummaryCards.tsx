import { Bell, CalendarClock, ClipboardList } from "lucide-react";
import type { NotificationItem } from "../../../types/notification";

export default function InboxSummaryCards({ items }: { items: NotificationItem[] }) {
  const unread = items.filter((item) => !item.read_at).length;
  const requests = items.filter((item) =>
    ["request", "approval", "leave"].some((word) => item.kind.toLocaleLowerCase().includes(word)),
  ).length;
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = items.filter((item) => new Date(item.created_at).getTime() >= cutoff).length;

  const cards = [
    { label: "Unread", value: unread, note: "Needs your attention", icon: Bell, tone: "text-violet-700 bg-violet-100" },
    { label: "Requests", value: requests, note: "Requests and approvals", icon: ClipboardList, tone: "text-amber-700 bg-amber-100" },
    { label: "Last 7 days", value: recent, note: "Recent notifications", icon: CalendarClock, tone: "text-cyan-800 bg-cyan-100" },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-3" aria-label="Inbox summary">
      {cards.map(({ label, value, note, icon: Icon, tone }) => (
        <article key={label} className="rounded-2xl border p-5 shadow-sm"
          style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span>
          </div>
          <p className="mt-2 text-2xl font-extrabold">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{note}</p>
        </article>
      ))}
    </section>
  );
}
