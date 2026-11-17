import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { ChevronDown, ChevronRight, ListChecks, Plus } from "lucide-react";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import TicketStatusBadge from "../../components/TicketStatusBadge";
import {
  useCreateTicket,
  useTickets,
  useUpdateTicket,
  useUpdateTicketStatus,
} from "../../hooks/useTickets";
import { getErrorMessage } from "../../lib/errors";
import { emptyToNull, employeeLabel, statusLabel } from "../../lib/projectFormat";
import { ALL_TICKET_STATUSES, MEMBER_TICKET_STATUSES } from "../../types/project";
import type { DirectoryEmployee, Project, Ticket, TicketStatus } from "../../types/project";
import TicketLogs from "./TicketLogs";

const INPUT =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500";

interface Context {
  project: Project;
  isOwner: boolean;
  assignable: DirectoryEmployee[];
  byId: Map<string, DirectoryEmployee>;
}

function CreateTicketForm({
  ctx,
  topLevel,
  onDone,
}: {
  ctx: Context;
  topLevel: Ticket[];
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [parent, setParent] = useState("");
  const create = useCreateTicket();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Ticket title is required.");
      return;
    }
    try {
      await create.mutateAsync({
        projectId: ctx.project.id,
        payload: {
          title: title.trim(),
          description: emptyToNull(description),
          assigned_to_id: assignee || null,
          parent_ticket_id: parent || null,
        },
      });
      toast.success("Ticket created.");
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not create the ticket."));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-lg border border-violet-200 bg-violet-50/40 p-4 space-y-3">
      <input
        className={`${INPUT} w-full`}
        placeholder="Ticket title *"
        value={title}
        maxLength={200}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className={`${INPUT} w-full`}
        rows={2}
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select className={INPUT} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">Unassigned</option>
          {ctx.assignable.map((e) => (
            <option key={e.id} value={e.id}>
              {employeeLabel(e)}
            </option>
          ))}
        </select>
        <select className={INPUT} value={parent} onChange={(e) => setParent(e.target.value)}>
          <option value="">Top-level ticket</option>
          {topLevel.map((t) => (
            <option key={t.id} value={t.id}>
              Subtask of: {t.title}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="px-3 py-1.5 text-sm rounded-lg text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
        <button
          type="submit"
          disabled={create.isPending}
          className="px-4 py-1.5 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {create.isPending ? "Creating..." : "Create ticket"}
        </button>
      </div>
    </form>
  );
}

function TicketRow({
  ticket,
  depth,
  ctx,
  childrenMap,
}: {
  ticket: Ticket;
  depth: number;
  ctx: Context;
  childrenMap: Map<string, Ticket[]>;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description ?? "");
  const updateTicket = useUpdateTicket();
  const updateStatus = useUpdateTicketStatus();
  const kids = childrenMap.get(ticket.id) ?? [];
  const statuses: TicketStatus[] = ctx.isOwner ? ALL_TICKET_STATUSES : MEMBER_TICKET_STATUSES;

  async function changeAssignee(value: string) {
    try {
      await updateTicket.mutateAsync({
        projectId: ctx.project.id,
        ticketId: ticket.id,
        payload: { assigned_to_id: value || null },
      });
      toast.success(value ? "Ticket assigned." : "Ticket unassigned.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not change the assignee."));
    }
  }

  async function changeStatus(value: TicketStatus) {
    try {
      await updateStatus.mutateAsync({ projectId: ctx.project.id, ticketId: ticket.id, status: value });
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not change the status."));
    }
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Ticket title is required.");
      return;
    }
    try {
      await updateTicket.mutateAsync({
        projectId: ctx.project.id,
        ticketId: ticket.id,
        payload: { title: title.trim(), description: emptyToNull(description) },
      });
      toast.success("Ticket updated.");
      setEditing(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update the ticket."));
    }
  }

  return (
    <>
      <div
        className="border border-slate-200 rounded-lg bg-white p-3"
        style={{ marginLeft: depth * 24 }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setOpen((v) => !v)} className="text-slate-400 hover:text-slate-700">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <p className="flex-1 min-w-[10rem] text-sm font-medium text-slate-900">{ticket.title}</p>

          {ctx.isOwner ? (
            <select
              value={ticket.assigned_to_id ?? ""}
              onChange={(e) => changeAssignee(e.target.value)}
              disabled={updateTicket.isPending}
              className={`${INPUT} py-1 max-w-[14rem]`}
            >
              <option value="">Unassigned</option>
              {ctx.assignable.map((e) => (
                <option key={e.id} value={e.id}>
                  {employeeLabel(e)}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-slate-500">
              {ticket.assigned_to_id ? employeeLabel(ctx.byId.get(ticket.assigned_to_id)) : "Unassigned"}
            </span>
          )}

          <select
            value={ticket.status}
            onChange={(e) => changeStatus(e.target.value as TicketStatus)}
            disabled={updateStatus.isPending}
            className={`${INPUT} py-1 capitalize`}
          >
            {/* Keep the current value selectable even if this user cannot set it. */}
            {!statuses.includes(ticket.status) && (
              <option value={ticket.status} disabled>
                {statusLabel(ticket.status)}
              </option>
            )}
            {statuses.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
          <TicketStatusBadge status={ticket.status} />
        </div>

        {open && (
          <div className="mt-3 pl-7">
            {editing ? (
              <form onSubmit={saveEdit} className="space-y-2">
                <input
                  className={`${INPUT} w-full`}
                  value={title}
                  maxLength={200}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  className={`${INPUT} w-full`}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={updateTicket.isPending}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setTitle(ticket.title);
                      setDescription(ticket.description ?? "");
                    }}
                    className="px-3 py-1.5 text-sm rounded-lg text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {ticket.description ?? "No description."}
                </p>
                {ctx.isOwner && (
                  <button
                    onClick={() => setEditing(true)}
                    className="mt-2 text-xs font-medium text-violet-700 hover:underline"
                  >
                    Edit title and description
                  </button>
                )}
              </>
            )}
            <TicketLogs projectId={ctx.project.id} ticketId={ticket.id} />
          </div>
        )}
      </div>

      {kids.map((kid) => (
        <TicketRow key={kid.id} ticket={kid} depth={depth + 1} ctx={ctx} childrenMap={childrenMap} />
      ))}
    </>
  );
}

export default function TicketsPanel({
  project,
  isOwner,
  directory,
}: {
  project: Project;
  isOwner: boolean;
  directory: DirectoryEmployee[];
}) {
  const { data: tickets, isLoading, isError, refetch } = useTickets(project.id);
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);

  const byId = useMemo(() => new Map(directory.map((e) => [e.id, e])), [directory]);
  // Tickets can be assigned to the manager or to project members only.
  const assignable = useMemo(() => {
    const ids = new Set([project.manager_id, ...project.members.map((m) => m.employee_id)]);
    return directory.filter((e) => ids.has(e.id));
  }, [directory, project]);

  const all = tickets ?? [];
  const visible = filter === "all" ? all : all.filter((t) => t.status === filter);
  const visibleIds = new Set(visible.map((t) => t.id));
  const roots = visible.filter((t) => !t.parent_ticket_id || !visibleIds.has(t.parent_ticket_id));
  const childrenMap = new Map<string, Ticket[]>();
  for (const t of visible) {
    if (t.parent_ticket_id && visibleIds.has(t.parent_ticket_id)) {
      const list = childrenMap.get(t.parent_ticket_id) ?? [];
      list.push(t);
      childrenMap.set(t.parent_ticket_id, list);
    }
  }
  const topLevelAll = all.filter((t) => !t.parent_ticket_id);

  const ctx: Context = { project, isOwner, assignable, byId };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Tickets ({all.length})</h3>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as TicketStatus | "all")}
            className={`${INPUT} py-1.5 capitalize`}
          >
            <option value="all">All statuses</option>
            {ALL_TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
          {isOwner && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" />
              New ticket
            </button>
          )}
        </div>
      </div>

      {showForm && <CreateTicketForm ctx={ctx} topLevel={topLevelAll} onDone={() => setShowForm(false)} />}

      <div className="mt-4 space-y-2">
        {isLoading ? (
          <LoadingState label="Loading tickets..." />
        ) : isError ? (
          <ErrorState message="Could not load tickets." onRetry={() => refetch()} />
        ) : roots.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title={all.length === 0 ? "No tickets yet" : "No tickets match this filter"}
            description={isOwner && all.length === 0 ? "Create the first ticket to start assigning work." : undefined}
          />
        ) : (
          roots.map((t) => <TicketRow key={t.id} ticket={t} depth={0} ctx={ctx} childrenMap={childrenMap} />)
        )}
      </div>
    </div>
  );
}