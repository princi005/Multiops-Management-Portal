import { useCallback, useId, useMemo, useState } from "react";
import type { DragEvent } from "react";
import type { FormEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, List, Search } from "lucide-react";
import type { DirectoryEmployee, Ticket, TicketStatus } from "../../types/project";

type ViewMode = "board" | "list";
type SortField = "title" | "assignee" | "priority" | "progress" | "due" | "approval" | "status" | "updated";

const STATUS_LABELS: Record<TicketStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  for_review: "For review",
  completed: "Completed",
  cancelled: "Cancelled",
  dropped: "Dropped",
};

const STATUS_STYLES: Record<TicketStatus, string> = {
  not_started: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-800",
  for_review: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
  dropped: "bg-slate-200 text-slate-600",
};

function priorityStyle(priority: string) {
  const value = priority.toLocaleLowerCase();
  if (value.includes("urgent")) return "bg-rose-100 text-rose-800";
  if (value.includes("high")) return "bg-orange-100 text-orange-800";
  if (value.includes("low")) return "bg-slate-100 text-slate-600";
  return "bg-violet-100 text-violet-800";
}

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString();
}

function displayName(person: DirectoryEmployee | undefined) {
  return person?.full_name || person?.email || "Assigned";
}

type PreviewReply = {
  id: number;
  body: string;
  createdAt: string;
};

function TicketDiscussionPreview({ ticketId }: { ticketId: string }) {
  const [draft, setDraft] = useState("");
  const [replies, setReplies] = useState<PreviewReply[]>([]);

  function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setReplies((items) => [...items, { id: Date.now(), body, createdAt: new Date().toLocaleString() }]);
    setDraft("");
  }

  return (
    <details className="mt-3 border-t pt-3" style={{ borderColor: "var(--mo-border)" }}>
      <summary className="cursor-pointer text-xs font-semibold text-violet-700">
        Comments & activity ({replies.length})
      </summary>
      <p className="mt-2 text-[11px] text-slate-500">
        Preview only · replies are kept in this page session and are not sent or saved.
      </p>
      {replies.length > 0 && (
        <ul className="mt-2 space-y-2" aria-label={`Preview replies for ticket ${ticketId}`}>
          {replies.map((reply) => (
            <li key={reply.id} className="rounded-lg bg-slate-50 p-2 text-xs">
              <time className="text-slate-400">{reply.createdAt}</time>
              <p className="mt-1 whitespace-pre-wrap text-slate-700">{reply.body}</p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submitReply} className="mt-2 space-y-2">
        <label className="sr-only" htmlFor={`ticket-reply-${ticketId}`}>Write a ticket reply</label>
        <textarea
          id={`ticket-reply-${ticketId}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="Add a comment or progress update…"
          className="w-full rounded-lg border bg-white px-3 py-2 text-xs"
          style={{ borderColor: "var(--mo-border)" }}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!draft.trim()}
            className="rounded-lg bg-violet-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            Add preview comment
          </button>
        </div>
      </form>
    </details>
  );
}
export default function TicketWorkspaceViews({
  tickets,
  directory,
  editableStatuses,
  onStatusChange,
}: {
  tickets: Ticket[];
  directory: DirectoryEmployee[];
  editableStatuses: TicketStatus[];
  onStatusChange: (ticketId: string, status: TicketStatus) => void;
}) {
  const id = useId();
  const [view, setView] = useState<ViewMode>("board");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [sortField, setSortField] = useState<SortField>("updated");
  const [ascending, setAscending] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const peopleById = useMemo(
    () => new Map(directory.map((person) => [person.id, person])),
    [directory],
  );
  const personName = useCallback((employeeId: string | null) => {
    if (!employeeId) return "Unassigned";
    return displayName(peopleById.get(employeeId));
  }, [peopleById]);

  const availableStatuses = useMemo(
    () => Array.from(new Set([...editableStatuses, ...tickets.map((ticket) => ticket.status)])),
    [editableStatuses, tickets],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const searchable = [
        ticket.title,
        ticket.description ?? "",
        personName(ticket.assigned_to_id),
        ticket.priority,
      ].join(" ").toLocaleLowerCase();
      return matchesStatus && (!needle || searchable.includes(needle));
    });
  }, [tickets, search, statusFilter, personName]);

  const sorted = useMemo(() => {
    return [...filtered].sort((left, right) => {
      let result = 0;
      switch (sortField) {
        case "title":
          result = left.title.localeCompare(right.title);
          break;
        case "assignee":
          result = personName(left.assigned_to_id).localeCompare(personName(right.assigned_to_id));
          break;
        case "priority":
          result = left.priority.localeCompare(right.priority);
          break;
        case "progress":
          result = left.progress_percent - right.progress_percent;
          break;
        case "due":
          result = (left.due_date ?? "9999").localeCompare(right.due_date ?? "9999");
          break;
        case "approval":
          result = left.approval_status.localeCompare(right.approval_status);
          break;
        case "status":
          result = STATUS_LABELS[left.status].localeCompare(STATUS_LABELS[right.status]);
          break;
        case "updated":
          result = left.updated_at.localeCompare(right.updated_at);
          break;
      }
      return ascending ? result : -result;
    });
  }, [filtered, sortField, ascending, personName]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  function changeSort(field: SortField) {
    if (field === sortField) setAscending((value) => !value);
    else {
      setSortField(field);
      setAscending(true);
    }
    setPage(0);
  }

  function moveTicket(ticketId: string, status: TicketStatus) {
    if (editableStatuses.includes(status)) onStatusChange(ticketId, status);
  }

  function handleDrop(event: DragEvent<HTMLElement>, status: TicketStatus) {
    event.preventDefault();
    const ticketId = event.dataTransfer.getData("text/plain");
    if (ticketId) moveTicket(ticketId, status);
  }

  const sortButton = (field: SortField, label: string) => (
    <button type="button" onClick={() => changeSort(field)} className="font-semibold hover:text-violet-700">
      {label}{sortField === field ? (ascending ? " ↑" : " ↓") : ""}
    </button>
  );

  return (
    <section className="space-y-4" aria-label="Project tickets">
      <div className="flex flex-col gap-4 rounded-2xl border p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"
        style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">Project workspace</p>
          <h3 className="mt-1 text-lg font-bold">Tickets <span className="text-sm font-medium text-slate-500">({tickets.length})</span></h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border p-1" style={{ borderColor: "var(--mo-border)" }} role="group" aria-label="Ticket layout">
            <button type="button" aria-pressed={view === "board"} onClick={() => setView("board")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${view === "board" ? "bg-violet-700 text-white shadow-sm" : "text-slate-600 hover:bg-violet-50"}`}>
              <LayoutGrid className="h-4 w-4" /> Board
            </button>
            <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${view === "list" ? "bg-violet-700 text-white shadow-sm" : "text-slate-600 hover:bg-violet-50"}`}>
              <List className="h-4 w-4" /> List
            </button>
          </div>

          <label className="relative">
            <span className="sr-only">Search tickets</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input id={`${id}-search`} type="search" value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(0); }}
              placeholder="Search tickets"
              className="w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-sm sm:w-56"
              style={{ borderColor: "var(--mo-border)" }} />
          </label>

          <label>
            <span className="sr-only">Filter tickets by status</span>
            <select value={statusFilter}
              onChange={(event) => { setStatusFilter(event.target.value as TicketStatus | "all"); setPage(0); }}
              className="rounded-xl border bg-white px-3 py-2 text-sm"
              style={{ borderColor: "var(--mo-border)" }}>
              <option value="all">All statuses</option>
              {availableStatuses.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
            </select>
          </label>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500"
          style={{ borderColor: "var(--mo-border)", backgroundColor: "var(--mo-surface)" }}>
          {tickets.length ? "No tickets match your search or filter." : "No tickets in this project yet."}
        </div>
      ) : view === "board" ? (
        <div className="grid auto-cols-[minmax(17rem,1fr)] grid-flow-col gap-4 overflow-x-auto pb-3">
          {availableStatuses.map((status) => {
            const columnTickets = sorted.filter((ticket) => ticket.status === status);
            return (
              <section key={status} onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, status)}
                aria-label={`${STATUS_LABELS[status]} tickets`}
                className="min-h-64 rounded-2xl border p-3"
                style={{ borderColor: "var(--mo-border)", backgroundColor: "rgba(148, 163, 184, 0.10)" }}>
                <header className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${status === "completed" ? "bg-emerald-500" : status === "in_progress" ? "bg-blue-500" : status === "for_review" ? "bg-amber-500" : status === "cancelled" || status === "dropped" ? "bg-slate-400" : "bg-violet-500"}`} />
                    <h4 className="text-sm font-bold">{STATUS_LABELS[status]}</h4>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">{columnTickets.length}</span>
                </header>

                <div className="space-y-3">
                  {columnTickets.map((ticket) => {
                    const assignee = ticket.assigned_to_id ? peopleById.get(ticket.assigned_to_id) : undefined;
                    const initials = (assignee?.full_name || assignee?.email || "U")
                      .split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toLocaleUpperCase();

                    return (
                      <article key={ticket.id} draggable
                        onDragStart={(event) => event.dataTransfer.setData("text/plain", ticket.id)}
                        className="rounded-xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        style={{ borderColor: "var(--mo-border)", backgroundColor: "var(--mo-surface)" }}>
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="min-w-0 flex-1 text-sm font-bold leading-5">{ticket.title}</h5>
                          <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold capitalize ${priorityStyle(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        {ticket.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{ticket.description}</p>}

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${STATUS_STYLES[ticket.status]}`}>
                            {STATUS_LABELS[ticket.status]}
                          </span>
                          <span className="text-[11px] text-slate-500">{ticket.approval_status.replace(/_/g, " ")}</span>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>Progress</span><span>{ticket.progress_percent}%</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-violet-600" style={{ width: `${ticket.progress_percent}%` }} />
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--mo-border)" }}>
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-800">{initials}</span>
                            <span className="truncate text-xs text-slate-600">{displayName(assignee)}</span>
                          </div>
                          <span className="flex shrink-0 items-center gap-1 text-[11px] text-slate-500">
                            <CalendarDays className="h-3.5 w-3.5" />{formatDate(ticket.due_date)}
                          </span>
                        </div>

                        <label className="sr-only" htmlFor={`${id}-status-${ticket.id}`}>Change status for {ticket.title}</label>
                        <select id={`${id}-status-${ticket.id}`} value={ticket.status}
                          disabled={!editableStatuses.includes(ticket.status)}
                          onChange={(event) => moveTicket(ticket.id, event.target.value as TicketStatus)}
                          className="mt-3 w-full rounded-lg border bg-white px-2 py-1.5 text-xs"
                          style={{ borderColor: "var(--mo-border)" }}>
                          {availableStatuses.map((option) => <option key={option} value={option}>{STATUS_LABELS[option]}</option>)}
                        </select>
                        <TicketDiscussionPreview ticketId={ticket.id} />
                      </article>
                    );
                  })}

                  {columnTickets.length === 0 && (
                    <p className="rounded-xl border border-dashed p-5 text-center text-xs text-slate-500"
                      style={{ borderColor: "var(--mo-border)" }}>Drop a ticket here</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border shadow-sm"
          style={{ borderColor: "var(--mo-border)", backgroundColor: "var(--mo-surface)" }}>
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="border-b bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500"
              style={{ borderColor: "var(--mo-border)" }}>
              <tr>
                <th className="px-4 py-3">{sortButton("title", "Ticket")}</th>
                <th className="px-4 py-3">{sortButton("assignee", "Assignee")}</th>
                <th className="px-4 py-3">{sortButton("priority", "Priority")}</th>
                <th className="px-4 py-3">{sortButton("progress", "Progress")}</th>
                <th className="px-4 py-3">{sortButton("due", "Due date")}</th>
                <th className="px-4 py-3">{sortButton("approval", "Approval")}</th>
                <th className="px-4 py-3">{sortButton("status", "Status")}</th>
                <th className="px-4 py-3">{sortButton("updated", "Updated")}</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((ticket) => (
                <tr key={ticket.id} className="border-b last:border-0 hover:bg-violet-50/40"
                  style={{ borderColor: "var(--mo-border)" }}>
                  <td className="max-w-sm px-4 py-3">
                    <p className="font-semibold">{ticket.title}</p>
                    {ticket.description && <p className="mt-1 truncate text-xs text-slate-500">{ticket.description}</p>}
                    <TicketDiscussionPreview ticketId={ticket.id} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{personName(ticket.assigned_to_id)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${priorityStyle(ticket.priority)}`}>{ticket.priority}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-violet-600" style={{ width: `${ticket.progress_percent}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{ticket.progress_percent}%</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(ticket.due_date)}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{ticket.approval_status.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    <label className="sr-only" htmlFor={`${id}-list-status-${ticket.id}`}>Status for {ticket.title}</label>
                    <select id={`${id}-list-status-${ticket.id}`} value={ticket.status}
                      disabled={!editableStatuses.includes(ticket.status)}
                      onChange={(event) => moveTicket(ticket.id, event.target.value as TicketStatus)}
                      className="rounded-lg border bg-white px-2 py-1.5 text-xs"
                      style={{ borderColor: "var(--mo-border)" }}>
                      {availableStatuses.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{new Date(ticket.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {pageItems.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-500">No tickets on this page.</td></tr>}
            </tbody>
          </table>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-slate-600"
            style={{ borderColor: "var(--mo-border)" }}>
            <span>{sorted.length ? safePage * pageSize + 1 : 0}–{Math.min((safePage + 1) * pageSize, sorted.length)} of {sorted.length} tickets</span>
            <div className="flex gap-2">
              <button type="button" disabled={safePage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />Previous
              </button>
              <button type="button" disabled={safePage >= pageCount - 1} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 disabled:opacity-40">
                Next<ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </div>
      )}
    </section>
  );
}
