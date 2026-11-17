import { useState } from "react";
import toast from "react-hot-toast";
import { ClipboardList, Plus } from "lucide-react";
import {
  useCancelChangeRequest,
  useMyChangeRequests,
  useSubmitChangeRequest,
} from "../../hooks/useProfileChanges";
import { getErrorMessage } from "../../lib/errors";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import ChangeStatusBadge from "../../components/ChangeStatusBadge";
import ChangeRequestText from "../../components/ChangeRequestText";

export default function ChangeRequestsSection() {
  const requests = useMyChangeRequests();
  const submit = useSubmitChangeRequest();
  const cancel = useCancelChangeRequest();

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  function closeForm() {
    setOpen(false);
    setText("");
  }

  function handleSubmit() {
    if (text.trim().length < 5) {
      toast.error("Please describe what you want changed (at least 5 characters).");
      return;
    }
    submit.mutate(
      { new_value: text.trim() },
      {
        onSuccess: () => {
          toast.success("Request sent to HR");
          closeForm();
        },
        onError: (err) => toast.error(getErrorMessage(err, "Could not send your request")),
      },
    );
  }

  function handleCancel(id: string) {
    if (!window.confirm("Cancel this request?")) return;
    cancel.mutate(id, {
      onSuccess: () => toast.success("Request cancelled"),
      onError: (err) => toast.error(getErrorMessage(err, "Could not cancel the request")),
    });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-slate-900">Profile Change Requests</h2>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            <Plus className="w-4 h-4" />
            Request a change
          </button>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Your profile details are read-only. To change anything (name, phone, address and so on), describe it below and
        HR will update it for you.
      </p>

      {open && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
          <label className="block text-xs uppercase tracking-wide text-slate-500 font-medium mb-1">
            What would you like to change?
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="For example: please update my phone number to +91 98765 43210."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <p className="mt-1 text-xs text-slate-400">{text.length} / 1000</p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submit.isPending}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {submit.isPending ? "Sending..." : "Send request"}
            </button>
            <button
              onClick={closeForm}
              disabled={submit.isPending}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {requests.isLoading && <LoadingState label="Loading your requests..." />}
      {requests.isError && <ErrorState message="Failed to load your requests." onRetry={() => requests.refetch()} />}

      {requests.data && requests.data.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon={ClipboardList}
            title="No change requests yet"
            description="Requests you send to HR, and their decisions, appear here."
          />
        </div>
      )}

      {requests.data && requests.data.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">Request</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">HR note</th>
                <th className="px-5 py-3 font-medium">Sent</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {requests.data.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 align-top">
                  <td className="px-5 py-3">
                    <ChangeRequestText request={r} />
                  </td>
                  <td className="px-5 py-3">
                    <ChangeStatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3 text-slate-600 whitespace-pre-line">{r.decision_note ?? "-"}</td>
                  <td className="px-5 py-3 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    {r.status === "pending" && (
                      <button
                        onClick={() => handleCancel(r.id)}
                        disabled={cancel.isPending}
                        className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}