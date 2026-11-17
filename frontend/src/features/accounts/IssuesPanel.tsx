import { Fragment, useState } from "react";
import toast from "react-hot-toast";
import { Inbox } from "lucide-react";
import { useIssuesForAccounts, useRespondToIssue } from "../../hooks/useIssues";
import { getErrorMessage } from "../../lib/errors";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import IssueStatusBadge from "../../components/IssueStatusBadge";
import { ISSUE_CATEGORY_LABELS } from "../../types/issue";
import type { IssueStatus } from "../../types/issue";

type ReplyStatus = "in_progress" | "resolved";

export default function IssuesPanel() {
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("open");
  const issues = useIssuesForAccounts(statusFilter);
  const respond = useRespondToIssue();

  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyStatus, setReplyStatus] = useState<ReplyStatus>("resolved");
  const [replyText, setReplyText] = useState("");

  function startReply(id: string, existingResponse: string | null) {
    setReplyingId(id);
    setReplyStatus("resolved");
    setReplyText(existingResponse ?? "");
  }

  function stopReply() {
    setReplyingId(null);
    setReplyText("");
  }

  function saveReply() {
    if (!replyingId) return;
    if (replyStatus === "resolved" && replyText.trim().length < 3) {
      toast.error("Please write a response before resolving.");
      return;
    }
    respond.mutate(
      { id: replyingId, status: replyStatus, response: replyText.trim() || null },
      {
        onSuccess: () => {
          toast.success(replyStatus === "resolved" ? "Issue resolved" : "Marked as in progress");
          stopReply();
        },
        onError: (err) => toast.error(getErrorMessage(err, "Could not save your reply")),
      },
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Employee Issues</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as IssueStatus | "all")}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="withdrawn">Withdrawn</option>
          <option value="all">All</option>
        </select>
      </div>

      {issues.isLoading && <LoadingState label="Loading issues..." />}
      {issues.isError && <ErrorState message="Failed to load issues." onRetry={() => issues.refetch()} />}

      {issues.data && issues.data.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon={Inbox}
            title={statusFilter === "open" ? "No open issues" : "No issues found"}
            description="Salary, payslip and attendance issues raised by employees appear here."
          />
        </div>
      )}

      {issues.data && issues.data.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Issue</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Sent</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {issues.data.map((i) => (
                <Fragment key={i.id}>
                  <tr className="border-t border-slate-100 align-top">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{i.employee_code}</p>
                      <p className="text-xs text-slate-500">{i.employee_name ?? i.employee_email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{i.subject}</p>
                      <p className="text-xs text-slate-500">{ISSUE_CATEGORY_LABELS[i.category]}</p>
                      <p className="mt-1 text-slate-600 whitespace-pre-line">{i.description}</p>
                      {i.response && (
                        <p className="mt-2 text-slate-500 whitespace-pre-line">
                          <span className="font-medium">Reply: </span>
                          {i.response}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <IssueStatusBadge status={i.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-500">{new Date(i.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {(i.status === "open" || i.status === "in_progress") && (
                        <button
                          onClick={() => startReply(i.id, i.response)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          Respond
                        </button>
                      )}
                    </td>
                  </tr>
                  {replyingId === i.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={5} className="px-5 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs uppercase tracking-wide text-slate-500 font-medium mb-1">
                              Move to
                            </label>
                            <select
                              value={replyStatus}
                              onChange={(e) => setReplyStatus(e.target.value as ReplyStatus)}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="resolved">Resolved</option>
                              <option value="in_progress">In progress</option>
                            </select>
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-xs uppercase tracking-wide text-slate-500 font-medium mb-1">
                              {replyStatus === "resolved" ? "Response (required)" : "Note for the employee (optional)"}
                            </label>
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              maxLength={1000}
                              rows={3}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={saveReply}
                            disabled={respond.isPending}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {respond.isPending ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={stopReply}
                            disabled={respond.isPending}
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