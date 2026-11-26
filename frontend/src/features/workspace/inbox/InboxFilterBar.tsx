import { Search } from "lucide-react";
import type { InboxFilter } from "./inboxUtils";

const filters: Array<{ id: InboxFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "projects", label: "Project work" },
  { id: "requests", label: "Requests" },
  { id: "comments", label: "Comments" },
  { id: "announcements", label: "Announcements" },
  { id: "other", label: "Other" },
];

export default function InboxFilterBar({
  filter,
  query,
  onFilterChange,
  onQueryChange,
}: {
  filter: InboxFilter;
  query: string;
  onFilterChange: (value: InboxFilter) => void;
  onQueryChange: (value: string) => void;
}) {
  return (
    <section className="space-y-4 rounded-2xl border p-4 shadow-sm"
      style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter notifications">
        {filters.map((item) => (
          <button key={item.id} type="button" aria-pressed={filter === item.id}
            onClick={() => onFilterChange(item.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              filter === item.id
                ? "bg-violet-700 text-white shadow-sm"
                : "border border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50"
            }`}>
            {item.label}
          </button>
        ))}
      </div>
      <label className="relative block max-w-xl">
        <span className="sr-only">Search notifications</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search notifications"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm" />
      </label>
    </section>
  );
}
