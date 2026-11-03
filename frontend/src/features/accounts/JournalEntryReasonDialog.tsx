import { useState } from "react";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../lib/errors";

export default function JournalEntryReasonDialog({
  title,
  description,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: (reason: string) => Promise<unknown>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Action failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-1">{title}</h2>
        <p className="text-xs text-slate-500 mb-4">{description}</p>

        <label className="block text-sm text-slate-700">Reason (required)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="text-sm text-slate-600 px-3 py-2">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={reason.trim().length < 3 || busy}
            className={`text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50 ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-violet-600 hover:bg-violet-700"
            }`}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}