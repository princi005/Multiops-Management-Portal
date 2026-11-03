import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useCreateJournalEntry,
  useFinancialPeriods,
  useGLAccounts,
  useParties,
  useUpdateJournalEntry,
} from "../../hooks/useAccounting";
import { getErrorMessage } from "../../lib/errors";
import type { JournalEntry, JournalEntryLineInput } from "../../types/accounting";

const today = () => new Date().toISOString().slice(0, 10);
const emptyLine = (): JournalEntryLineInput => ({
  gl_account_id: "",
  party_id: null,
  debit: 0,
  credit: 0,
});
const round2 = (n: number) => Math.round(n * 100) / 100;

const cellClass =
  "rounded-lg border border-slate-300 px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500";

export default function JournalEntryPanel({
  entry,
  onClose,
}: {
  entry?: JournalEntry;
  onClose: () => void;
}) {
  const isEdit = entry !== undefined;

  const { data: accounts } = useGLAccounts();
  const { data: periods } = useFinancialPeriods();
  const { data: parties } = useParties();
  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();

  const openPeriod = periods?.find((p) => p.status === "open");

  const [entryDate, setEntryDate] = useState(entry?.entry_date ?? today());
  const [reference, setReference] = useState(entry?.reference ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [reason, setReason] = useState("");
  const [lines, setLines] = useState<JournalEntryLineInput[]>(
    entry
      ? entry.lines.map((l) => ({
          gl_account_id: l.gl_account_id,
          department_id: l.department_id,
          party_id: l.party_id,
          debit: Number(l.debit),
          credit: Number(l.credit),
          line_description: l.line_description,
        }))
      : [emptyLine(), emptyLine()]
  );

  const totalDebit = round2(lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0));
  const totalCredit = round2(lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0));
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;
  const linesValid = lines.every(
    (l) => l.gl_account_id !== "" && (Number(l.debit) > 0) !== (Number(l.credit) > 0)
  );
  const busy = createEntry.isPending || updateEntry.isPending;
  const canSubmit =
    isBalanced &&
    linesValid &&
    description.trim() !== "" &&
    (!isEdit || reason.trim().length >= 3) &&
    !busy;

  const updateLine = (index: number, patch: Partial<JournalEntryLineInput>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    try {
      if (isEdit && entry) {
        await updateEntry.mutateAsync({
          id: entry.id,
          payload: {
            entry_date: entryDate,
            reference: reference || null,
            description,
            lines,
            reason: reason.trim(),
          },
        });
        toast.success("Entry updated and the change was logged");
      } else {
        if (!openPeriod) {
          toast.error("No open financial period found.");
          return;
        }
        await createEntry.mutateAsync({
          period_id: openPeriod.id,
          entry_date: entryDate,
          reference: reference || null,
          description,
          lines,
        });
        toast.success("Journal entry posted");
      }
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save the entry"));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center px-4 z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-3xl">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          {isEdit ? "Edit Journal Entry" : "New Journal Entry"}
        </h2>

        {isEdit && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg px-3 py-2 mb-4">
            This entry is already posted. Your change, and the reason you give below, are permanently
            recorded in the audit log.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm text-slate-700">Date</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className={`mt-1 w-full ${cellClass} text-sm py-2`}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700">Reference</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="JE-003"
              className={`mt-1 w-full ${cellClass} text-sm py-2`}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-slate-700">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`mt-1 w-full ${cellClass} text-sm py-2`}
          />
        </div>

        <div className="grid grid-cols-12 gap-2 text-xs text-slate-500 mb-1 px-1">
          <span className="col-span-4">Account</span>
          <span className="col-span-3">Customer / Vendor</span>
          <span className="col-span-2">Debit</span>
          <span className="col-span-2">Credit</span>
        </div>

        <div className="space-y-2 mb-3">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <select
                value={line.gl_account_id}
                onChange={(e) => updateLine(i, { gl_account_id: e.target.value })}
                className={`col-span-4 ${cellClass}`}
              >
                <option value="">Select account</option>
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name}
                  </option>
                ))}
              </select>
              <select
                value={line.party_id ?? ""}
                onChange={(e) => updateLine(i, { party_id: e.target.value || null })}
                className={`col-span-3 ${cellClass}`}
              >
                <option value="">- No party -</option>
                {parties?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.party_type})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                placeholder="Debit"
                value={line.debit || ""}
                onChange={(e) => updateLine(i, { debit: Number(e.target.value) || 0 })}
                className={`col-span-2 ${cellClass}`}
              />
              <input
                type="number"
                min="0"
                placeholder="Credit"
                value={line.credit || ""}
                onChange={(e) => updateLine(i, { credit: Number(e.target.value) || 0 })}
                className={`col-span-2 ${cellClass}`}
              />
              <button
                onClick={() => removeLine(i)}
                disabled={lines.length <= 2}
                className="col-span-1 text-slate-400 hover:text-red-600 disabled:opacity-30 flex justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button onClick={addLine} className="flex items-center gap-1 text-violet-600 text-sm font-medium mb-4">
          <Plus className="w-4 h-4" />
          Add line
        </button>

        <div className="flex justify-between items-center bg-slate-50 rounded-lg px-4 py-3 mb-4 text-sm">
          <span className="text-slate-600">
            Debits: <strong>{totalDebit.toFixed(2)}</strong> | Credits: <strong>{totalCredit.toFixed(2)}</strong>
          </span>
          <span className={isBalanced ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
            {isBalanced ? "Balanced" : "Not balanced"}
          </span>
        </div>

        {isEdit && (
          <div className="mb-4">
            <label className="block text-sm text-slate-700">Reason for this change (required)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Amount corrected after invoice review"
              className={`mt-1 w-full ${cellClass} text-sm py-2`}
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-slate-600 px-3 py-2">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50"
          >
            {busy ? "Saving..." : isEdit ? "Save Changes" : "Post Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}