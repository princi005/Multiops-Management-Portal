import { useUpdateTicket, useSetTicketApproval } from "../../hooks/useTickets";
import { useActiveOrganization } from "../../hooks/useActiveOrganizationInfo";
import { useOrganizationSettings } from "../../hooks/useOrganizations";
import type { Ticket } from "../../types/project";

export default function TicketMetadataControls({
  projectId,
  ticket,
  canManage,
}: {
  projectId: string;
  ticket: Ticket;
  canManage: boolean;
}) {
  const updateTicket = useUpdateTicket();
  const setApproval = useSetTicketApproval();
  const activeOrganization = useActiveOrganization();
  const settings = useOrganizationSettings(activeOrganization.data?.organization.id);
  const configuredPriorities = settings.data?.priorities ?? ["low", "normal", "high", "urgent"];
  const priorities = Array.from(new Set([...configuredPriorities, ticket.priority]));

  return (
    <section className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-4">
      <label className="text-xs font-medium text-slate-600">Priority
        <select value={ticket.priority} disabled={!canManage || updateTicket.isPending}
          onChange={(event) => updateTicket.mutate({
            projectId, ticketId: ticket.id, payload: { priority: event.target.value },
          })}
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
        </select>
      </label>
      <label className="text-xs font-medium text-slate-600">Progress (%)
        <input type="number" min="0" max="100" value={ticket.progress_percent}
          disabled={!canManage || updateTicket.isPending}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (Number.isInteger(value) && value >= 0 && value <= 100) {
              updateTicket.mutate({ projectId, ticketId: ticket.id, payload: { progress_percent: value } });
            }
          }}
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
      </label>
      <label className="text-xs font-medium text-slate-600">Due date
        <input type="date" value={ticket.due_date ?? ""}
          disabled={!canManage || updateTicket.isPending}
          onChange={(event) => updateTicket.mutate({
            projectId, ticketId: ticket.id, payload: { due_date: event.target.value || null },
          })}
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
      </label>
      <label className="text-xs font-medium text-slate-600">Manager approval
        <select value={ticket.approval_status}
          disabled={!canManage || setApproval.isPending || ticket.approval_status === "not_requested"}
          onChange={(event) => setApproval.mutate({
            projectId, ticketId: ticket.id, status: event.target.value as Ticket["approval_status"],
          })}
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="not_requested">Not requested</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>
      {updateTicket.isError && <p className="text-xs text-red-600">Could not save ticket metadata.</p>}
      {setApproval.isError && <p className="text-xs text-red-600">Could not save approval status.</p>}
    </section>
  );
}
