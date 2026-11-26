import { Fragment, useState } from "react";
import toast from "react-hot-toast";
import { UserCog } from "lucide-react";
import { useChangeRequestsForHr, useDecideChangeRequest } from "../../hooks/useProfileChanges";
import { getErrorMessage } from "../../lib/errors";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import ChangeStatusBadge from "../../components/ChangeStatusBadge";
import ChangeRequestText from "../../components/ChangeRequestText";
import ChangeRequestEvidencePanel from "./ChangeRequestEvidencePanel";
import type { ChangeRequestForHr, ChangeStatus } from "../../types/profileChange";

interface Deciding {
  id: string;
  approve: boolean;
  general: boolean;
}

export default function ProfileChangeRequestsSection() {
  const [statusFilter, setStatusFilter] = useState<ChangeStatus | "all">("pending");
  const requests = useChangeRequestsForHr(statusFilter);
  const decide = useDecideChangeRequest();

  const [deciding, setDeciding] = useState<Deciding | null>(null);
  const [note, setNote] = useState("");
  const [evidenceFor, setEvidenceFor] = useState<string | null>(null);

  function startDeciding(r: ChangeRequestForHr, approve: boolean) {
    setDeciding({ id: r.id, approve, general: r.field === "general" });
    setNote("");
  }

  function stopDeciding() {
    setDeciding(null);
    setNote("");
  }

  function confirmDecision() {
    if (!deciding) return;
    if (!deciding.approve && !note.trim()) {
      toast.error("Please give a reason for rejecting.");
      return;
    }
    const current = deciding;
    decide.mutate(
      { id: current.id, approve: current.approve, decision_note: note.trim() || null },
      {
        onSuccess: () => {
          if (!current.approve) toast.success("Request rejected");
          else toast.success(current.general ? "Marked as done" : "Request approved and applied");
          stopDeciding();
        },
        onError: (err) => toast.error(getErrorMessage(err, "Could not save your decision")),
      },
    );
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-slate-900">Profile Change Requests</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ChangeStatus | "all")}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="pending">Pending</option>
          <option value="approved">Done / approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
          <option value="all">All</option>
        </select>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Employees describe what they want changed. Update their details yourself (Employees table, Edit), then mark the
        request done.
      </p>

      {requests.isLoading && <LoadingState label="Loading change requests..." />}
      {requests.isError && <ErrorState message="Failed to load change requests." onRetry={() => requests.refetch()} />}

      {requests.data && requests.data.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon={UserCog}
            title={statusFilter === "pending" ? "Nothing waiting for you" : "No requests found"}
            description="Change requests from employees appear here."
          />
        </div>
      )}

      {requests.data && requests.data.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Request</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Sent</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {requests.data.map((r) => (
                <Fragment key={r.id}>
                  <tr className="border-t border-slate-100 align-top">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{r.employee_code}</p>
                      <p className="text-xs text-slate-500">{r.employee_name ?? r.employee_email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <ChangeRequestText request={r} />
                      {r.reason && <p className="mt-1 text-xs text-slate-500 whitespace-pre-line">Reason: {r.reason}</p>}
                      <button
                        type="button"
                        onClick={() => setEvidenceFor(evidenceFor === r.id ? null : r.id)}
                        className="mt-2 text-xs font-medium text-teal-700 hover:text-teal-900"
                      >
                        {evidenceFor === r.id ? "Hide supporting documents" : "Review supporting documents"}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <ChangeStatusBadge status={r.status} />
                      {r.decision_note && (
                        <p className="mt-1 text-xs text-slate-500 whitespace-pre-line">{r.decision_note}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {r.status === "pending" && (
                        <>
                          <button
                            onClick={() => startDeciding(r, true)}
                            className="text-sm font-medium text-teal-600 hover:text-teal-700 mr-3"
                          >
                            {r.field === "general" ? "Mark done" : "Approve"}
                          </button>
                          <button
                            onClick={() => startDeciding(r, false)}
                            className="text-sm font-medium text-red-600 hover:text-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                  {evidenceFor === r.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={5} className="px-5 py-4">
                        <ChangeRequestEvidencePanel requestId={r.id} />
                      </td>
                    </tr>
                  )}
                  {deciding && deciding.id === r.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={5} className="px-5 py-4">
                        <label className="block text-xs uppercase tracking-wide text-slate-500 font-medium mb-1">
                          {deciding.approve ? "Note for the employee (optional)" : "Reason for rejecting (required)"}
                        </label>
                        <input
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          maxLength={500}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={confirmDecision}
                            disabled={decide.isPending}
                            className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                              deciding.approve ? "bg-teal-600 hover:bg-teal-700" : "bg-red-600 hover:bg-red-700"
                            }`}
                          >
                            {decide.isPending
                              ? "Saving..."
                              : deciding.approve
                                ? deciding.general
                                  ? "Confirm done"
                                  : "Confirm approval"
                                : "Confirm rejection"}
                          </button>
                          <button
                            onClick={stopDeciding}
                            disabled={decide.isPending}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}