import { useState } from "react";
import toast from "react-hot-toast";
import { LifeBuoy, Plus } from "lucide-react";
import { useCreateIssue, useMyIssues, useWithdrawIssue } from "../../hooks/useIssues";
import { getErrorMessage } from "../../lib/errors";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import IssueStatusBadge from "../../components/IssueStatusBadge";
import { ISSUE_CATEGORY_LABELS } from "../../types/issue";
import type { IssueCategory } from "../../types/issue";

const CATEGORIES: IssueCategory[] = ["salary", "payslip", "attendance", "other"];

export default function IssuesSection() {
  const issues = useMyIssues();
  const create = useCreateIssue();
  const withdraw = useWithdrawIssue();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<IssueCategory>("salary");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  function closeForm() {
    setOpen(false);
    setSubject("");
    setDescription("");
  }

  function handleSubmit() {
    if (subject.trim().length < 3) {
      toast.error("Please add a short subject (at least 3 characters).");
      return;
    }
    if (description.trim().length < 10) {
      toast.error("Please describe the issue (at least 10 characters).");
      return;
    }
    create.mutate(
      { category, subject: subject.trim(), description: description.trim() },
      {
        onSuccess: () => {
          toast.success("Issue sent to Accounts");
          closeForm();
        },
        onError: (err) => toast.error(getErrorMessage(err, "Could not raise your issue")),
      },
    );
  }

  function handleWithdraw(id: string) {
    if (!window.confirm("Withdraw this issue?")) return;
    withdraw.mutate(id, {
      onSuccess: () => toast.success("Issue withdrawn"),
      onError: (err) => toast.error(getErrorMessage(err, "Could not withdraw the issue")),
    });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-slate-900">My Issues</h2>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            <Plus className="w-4 h-4" />
            Raise an issue
          </button>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Something wrong with your salary, payslip or attendance? Raise an issue and Accounts will look into it.
      </p>

      {open && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-500 font-medium mb-1">
                About
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {ISSUE_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wide text-slate-500 font-medium mb-1">
                Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={150}
                placeholder="A short summary"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs uppercase tracking-wide text-slate-500 font-medium mb-1">
              What happened?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Include dates and amounts if you can."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="mt-1 text-xs text-slate-400">{description.length} / 2000</p>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={create.isPending}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {create.isPending ? "Sending..." : "Send to Accounts"}
            </button>
            <button
              onClick={closeForm}
              disabled={create.isPending}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {issues.isLoading && <LoadingState label="Loading your issues..." />}
      {issues.isError && <ErrorState message="Failed to load your issues." onRetry={() => issues.refetch()} />}

      {issues.data && issues.data.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon={LifeBuoy}
            title="No issues raised"
            description="Issues you raise with Accounts, and their replies, appear here."
          />
        </div>
      )}

      {issues.data && issues.data.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">Issue</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Accounts reply</th>
                <th className="px-5 py-3 font-medium">Sent</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {issues.data.map((i) => (
                <tr key={i.id} className="border-t border-slate-100 align-top">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{i.subject}</p>
                    <p className="text-xs text-slate-500">{ISSUE_CATEGORY_LABELS[i.category]}</p>
                    <p className="mt-1 text-slate-600 whitespace-pre-line">{i.description}</p>
                  </td>
                  <td className="px-5 py-3">
                    <IssueStatusBadge status={i.status} />
                  </td>
                  <td className="px-5 py-3 text-slate-600 whitespace-pre-line">{i.response ?? "-"}</td>
                  <td className="px-5 py-3 text-slate-500">{new Date(i.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    {(i.status === "open" || i.status === "in_progress") && (
                      <button
                        onClick={() => handleWithdraw(i.id)}
                        disabled={withdraw.isPending}
                        className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Withdraw
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