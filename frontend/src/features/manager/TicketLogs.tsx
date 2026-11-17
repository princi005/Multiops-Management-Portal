import { useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { useAddTicketLog, useTicketLogs } from "../../hooks/useTickets";
import { getErrorMessage } from "../../lib/errors";
import { formatDateTime, statusLabel } from "../../lib/projectFormat";

export default function TicketLogs({ projectId, ticketId }: { projectId: string; ticketId: string }) {
  const { data: logs, isLoading } = useTicketLogs(ticketId, true);
  const add = useAddTicketLog();
  const [note, setNote] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    try {
      await add.mutateAsync({ projectId, ticketId, note: note.trim() });
      setNote("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not add the note."));
    }
  }

  return (
    <div className="mt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Activity</p>
      {isLoading ? (
        <p className="mt-2 text-xs text-slate-400">Loading...</p>
      ) : (logs ?? []).length === 0 ? (
        <p className="mt-2 text-xs text-slate-400">No activity yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {(logs ?? []).map((log) => (
            <li key={log.id} className="text-xs text-slate-600">
              <span className="text-slate-400">{formatDateTime(log.created_at)}</span>
              {log.status_to && (
                <span className="ml-2 font-medium text-slate-700">
                  {log.status_from ? `${statusLabel(log.status_from)} \u2192 ` : ""}
                  {statusLabel(log.status_to)}
                </span>
              )}
              {log.note && <p className="mt-0.5 text-slate-700">{log.note}</p>}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button
          type="submit"
          disabled={!note.trim() || add.isPending}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50"
        >
          Add note
        </button>
      </form>
    </div>
  );
}