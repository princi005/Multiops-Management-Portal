import { X } from "lucide-react";
import { useGLAccounts, useJournalEntryAudit } from "../../hooks/useAccounting";
import LoadingState from "../../components/LoadingState";
import type { JournalEntry, JournalEntrySnapshot } from "../../types/accounting";

function SnapshotView({
  snapshot,
  accountLabel,
}: {
  snapshot: JournalEntrySnapshot | null;
  accountLabel: (id: string) => string;
}) {
  if (!snapshot) return <p className="text-xs text-slate-400">-</p>;
  return (
    <div className="text-xs space-y-1">
      <p className="font-medium text-slate-800">{snapshot.description}</p>
      <p className="text-slate-500">
        {snapshot.entry_date}
        {snapshot.reference ? ` | ${snapshot.reference}` : ""}
      </p>
      {snapshot.lines.map((l, i) => (
        <div key={i} className="flex justify-between gap-3 text-slate-600">
          <span>{accountLabel(l.gl_account_id)}</span>
          <span className="whitespace-nowrap">
            {l.debit > 0 ? `Dr ${l.debit.toFixed(2)}` : `Cr ${l.credit.toFixed(2)}`}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AuditHistoryPanel({
  entry,
  onClose,
}: {
  entry: JournalEntry;
  onClose: () => void;
}) {
  const { data: logs, isLoading } = useJournalEntryAudit(entry.id);
  const { data: accounts } = useGLAccounts();

  const accountLabel = (id: string) => {
    const a = accounts?.find((acc) => acc.id === id);
    return a ? `${a.code} ${a.name}` : id;
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center px-4 z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-3xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Change history</h2>
            <p className="text-xs text-slate-500">
              {entry.description}
              {entry.reference ? ` | ${entry.reference}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading && <LoadingState label="Loading history..." />}

        {logs && logs.length === 0 && (
          <p className="text-sm text-slate-500 py-6 text-center">
            No changes recorded yet. Edits made from now on will appear here.
          </p>
        )}

        <div className="space-y-4">
          {logs?.map((log) => (
            <div key={log.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-semibold text-slate-900 capitalize">{log.action}</p>
                <p className="text-xs text-slate-500">
                  {log.changed_by_email ?? "unknown user"} | {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                <span className="font-medium">Reason:</span> {log.reason}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-700 mb-2">Before</p>
                  <SnapshotView snapshot={log.previous_value as JournalEntrySnapshot | null} accountLabel={accountLabel} />
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-emerald-700 mb-2">After</p>
                  <SnapshotView snapshot={log.new_value as JournalEntrySnapshot | null} accountLabel={accountLabel} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}