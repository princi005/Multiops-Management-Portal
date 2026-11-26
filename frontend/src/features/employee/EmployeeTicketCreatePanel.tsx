import { useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../lib/errors";
import { useCreateTicket } from "../../hooks/useTickets";
import { useActiveOrganization } from "../../hooks/useActiveOrganizationInfo";
import { useOrganizationSettings } from "../../hooks/useOrganizations";

const DEFAULT_PRIORITIES = ["low", "normal", "high", "urgent"];

export default function EmployeeTicketCreatePanel({
  projectId,
  employeeId,
  onCreated,
  onCancel,
}: {
  projectId: string;
  employeeId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const createTicket = useCreateTicket();
  const activeOrganization = useActiveOrganization();
  const settings = useOrganizationSettings(activeOrganization.data?.organization.id);

  const configuredPriorities = settings.data?.priorities ?? [];
  const priorities = configuredPriorities.length
    ? configuredPriorities
    : DEFAULT_PRIORITIES;
  const selectedPriority = priorities.includes(priority)
    ? priority
    : priorities[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (title.trim().length < 3) {
      toast.error("Enter a ticket title with at least 3 characters.");
      return;
    }

    try {
      await createTicket.mutateAsync({
        projectId,
        payload: {
          title: title.trim(),
          description: description.trim() || null,
          parent_ticket_id: null,
          assigned_to_id: employeeId,
          priority: selectedPriority,
          due_date: null,
        },
      });
      toast.success("Ticket created and assigned to you.");
      onCreated();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not create the ticket."));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-4 rounded-2xl border p-4 sm:p-5"
      style={{
        backgroundColor: "var(--mo-card)",
        borderColor: "var(--mo-border-accent)",
      }}
    >
      <div>
        <h4 className="font-bold">Create a ticket</h4>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          It will be assigned to you and submitted for manager review.
        </p>
      </div>

      <label className="block text-sm font-semibold">
        Ticket title
        <input
          autoFocus
          required
          minLength={3}
          maxLength={200}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Summarize what needs to be done"
          className="mo-input mt-1 px-3 py-2.5"
        />
      </label>

      <label className="block text-sm font-semibold">
        Details
        <textarea
          rows={4}
          maxLength={5000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add the context, steps, or outcome needed"
          className="mo-input mt-1 px-3 py-2.5"
        />
        <span className="mt-1 block text-right text-xs font-normal text-slate-500">
          {description.length}/5000
        </span>
      </label>

      <label className="block max-w-sm text-sm font-semibold">
        Priority
        <select
          value={selectedPriority}
          onChange={(event) => setPriority(event.target.value)}
          disabled={settings.isLoading || priorities.length === 0}
          className="mo-input mt-1 px-3 py-2.5"
        >
          {priorities.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={createTicket.isPending}
          className="rounded-xl border px-4 py-2.5 text-sm font-bold"
          style={{ borderColor: "var(--mo-border)" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createTicket.isPending || settings.isLoading || priorities.length === 0}
          className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createTicket.isPending ? "Creating…" : "Create ticket"}
        </button>
      </div>
    </form>
  );
}
