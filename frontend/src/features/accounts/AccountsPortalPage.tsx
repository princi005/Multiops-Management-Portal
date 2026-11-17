import { useState } from "react";
import { BookOpen, History, Lock, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import {
  useDeleteJournalEntry,
  useFinancialPeriods,
  useGLAccounts,
  useJournalEntries,
  useParties,
  useRestoreJournalEntry,
} from "../../hooks/useAccounting";
import { useEmployeeRequests } from "../../hooks/useEmployeeRequests";
import PortalHeader from "../../components/PortalHeader";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import Dropdown, { DropdownItem } from "../../components/Dropdown";
import ChartOfAccounts from "./ChartOfAccounts";
import EmployeeRequestsPanel from "./EmployeeRequestsPanel";
import IssuesPanel from "./IssuesPanel";
import JournalEntryPanel from "./JournalEntryPanel";
import JournalEntryReasonDialog from "./JournalEntryReasonDialog";
import AuditHistoryPanel from "./AuditHistoryPanel";
import PartiesPanel from "./PartiesPanel";
import TrialBalancePanel from "./TrialBalancePanel";
import PayrollPanel from "./PayrollPanel";
import type { JournalEntry } from "../../types/accounting";

type Tab = "approvals" | "payroll" | "journal" | "coa" | "parties" | "trial";

const TABS: { id: Tab; label: string }[] = [
  { id: "approvals", label: "Approvals" },
  { id: "payroll", label: "Payroll" },
  { id: "journal", label: "Journal Entries" },
  { id: "coa", label: "Chart of Accounts" },
  { id: "parties", label: "Customers & Vendors" },
  { id: "trial", label: "Trial Balance" },
];

export default function AccountsPortalPage() {
  const { data: user } = useCurrentUser();
  const {
    data: accounts,
    isLoading: accountsLoading,
    isError: accountsError,
    refetch: refetchAccounts,
  } = useGLAccounts();
  const { data: entries, isLoading: entriesLoading } = useJournalEntries();
  const { data: periods } = useFinancialPeriods();
  const { data: parties } = useParties();
  const { data: requests } = useEmployeeRequests();
  const deleteEntry = useDeleteJournalEntry();
  const restoreEntry = useRestoreJournalEntry();

  const [tab, setTab] = useState<Tab>("approvals");
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [historyEntry, setHistoryEntry] = useState<JournalEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<JournalEntry | null>(null);
  const [restoringEntry, setRestoringEntry] = useState<JournalEntry | null>(null);

  const pendingCount = requests?.filter((r) => r.status === "pending").length ?? 0;
  const openPeriodIds = new Set(periods?.filter((p) => p.status === "open").map((p) => p.id));

  const accountLabel = (id: string) => {
    const a = accounts?.find((acc) => acc.id === id);
    return a ? `${a.code} ${a.name}` : id;
  };
  const partyName = (id: string | null) => (id ? (parties?.find((p) => p.id === id)?.name ?? "") : "");

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader title="Accounts Portal" subtitle="General Ledger" email={user?.email} accent="violet" />

      <main className="p-8 max-w-5xl mx-auto">
        <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
                tab === t.id
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
              {t.id === "approvals" && pendingCount > 0 && (
                <span className="ml-2 bg-violet-600 text-white text-xs rounded-full px-2 py-0.5">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "approvals" && (
          <div className="space-y-10">
            <EmployeeRequestsPanel />
            <IssuesPanel />
          </div>
        )}
        {tab === "payroll" && <PayrollPanel />}

        {tab === "coa" && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Chart of Accounts</h2>
            <p className="text-sm text-slate-500 mb-4">
              The list of ledger accounts (assets, liabilities, equity, income, expenses) that every journal
              entry posts to.
            </p>
            {accountsLoading && <LoadingState label="Loading accounts..." />}
            {accountsError && <ErrorState message="Failed to load accounts." onRetry={() => refetchAccounts()} />}
            {accounts && <ChartOfAccounts accounts={accounts} />}
          </div>
        )}

        {tab === "journal" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Journal Entries</h2>
              <button
                onClick={() => setShowNewEntry(true)}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg px-4 py-2"
              >
                <Plus className="w-4 h-4" />
                New Entry
              </button>
            </div>

            {entriesLoading && <LoadingState label="Loading entries..." />}

            {entries && entries.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                <BookOpen className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No journal entries yet.</p>
              </div>
            )}

            <div className="space-y-3">
              {entries?.map((entry) => {
                const editable = openPeriodIds.has(entry.period_id);
                const isDeleted = entry.deleted_at !== null;
                return (
                  <div
                    key={entry.id}
                    className={`bg-white rounded-xl border shadow-sm p-4 ${
                      isDeleted ? "border-red-200 opacity-60" : "border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p
                          className={`text-sm font-semibold text-slate-900 ${
                            isDeleted ? "line-through" : ""
                          }`}
                        >
                          {entry.description}
                        </p>
                        <p className="text-xs text-slate-400">
                          {entry.entry_date}
                          {entry.reference ? ` | ${entry.reference}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isDeleted ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {isDeleted ? "deleted" : entry.status}
                        </span>
                        <Dropdown>
                          <DropdownItem onClick={() => setHistoryEntry(entry)} icon={<History className="w-4 h-4" />}>
                            History
                          </DropdownItem>
                          {!isDeleted && (
                            <>
                              <DropdownItem
                                onClick={() => setEditingEntry(entry)}
                                icon={<Pencil className="w-4 h-4" />}
                                disabled={!editable}
                              >
                                Edit
                              </DropdownItem>
                              <DropdownItem
                                onClick={() => setDeletingEntry(entry)}
                                icon={<Trash2 className="w-4 h-4" />}
                                disabled={!editable}
                                danger
                              >
                                Delete
                              </DropdownItem>
                            </>
                          )}
                          {isDeleted && (
                            <DropdownItem
                              onClick={() => setRestoringEntry(entry)}
                              icon={<RotateCcw className="w-4 h-4" />}
                              disabled={!editable}
                            >
                              Restore
                            </DropdownItem>
                          )}
                          {!editable && (
                            <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400">
                              <Lock className="w-3.5 h-3.5" />
                              Period locked
                            </div>
                          )}
                        </Dropdown>
                      </div>
                    </div>

                    <table className="w-full text-xs mt-2">
                      <thead>
                        <tr className="text-left text-slate-400">
                          <th className="py-1 font-medium">Account</th>
                          <th className="py-1 font-medium">Party</th>
                          <th className="py-1 font-medium text-right w-28">Debit</th>
                          <th className="py-1 font-medium text-right w-28">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.lines.map((line) => (
                          <tr key={line.id} className="border-t border-slate-100">
                            <td className="py-1.5 text-slate-700">{accountLabel(line.gl_account_id)}</td>
                            <td className="py-1.5 text-slate-500">{partyName(line.party_id)}</td>
                            <td className="py-1.5 text-right text-slate-900">
                              {line.debit > 0 ? line.debit.toFixed(2) : ""}
                            </td>
                            <td className="py-1.5 text-right text-slate-900">
                              {line.credit > 0 ? line.credit.toFixed(2) : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "parties" && <PartiesPanel />}
        {tab === "trial" && <TrialBalancePanel />}
      </main>

      {showNewEntry && <JournalEntryPanel onClose={() => setShowNewEntry(false)} />}
      {editingEntry && <JournalEntryPanel entry={editingEntry} onClose={() => setEditingEntry(null)} />}
      {historyEntry && <AuditHistoryPanel entry={historyEntry} onClose={() => setHistoryEntry(null)} />}

      {deletingEntry && (
        <JournalEntryReasonDialog
          title={`Delete "${deletingEntry.description}"`}
          description="The entry is kept for audit purposes and can be restored later. It stops counting in the ledger immediately."
          confirmLabel="Delete entry"
          danger
          onClose={() => setDeletingEntry(null)}
          onConfirm={(reason) => deleteEntry.mutateAsync({ id: deletingEntry.id, reason })}
        />
      )}

      {restoringEntry && (
        <JournalEntryReasonDialog
          title={`Restore "${restoringEntry.description}"`}
          description="This entry will count in the ledger and reports again."
          confirmLabel="Restore entry"
          onClose={() => setRestoringEntry(null)}
          onConfirm={(reason) => restoreEntry.mutateAsync({ id: restoringEntry.id, reason })}
        />
      )}
    </div>
  );
}
