import { useState } from "react";
import { Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useClosePeriod, useFinancialPeriods } from "../../hooks/useAccounting";
import { getErrorMessage } from "../../lib/errors";
import LoadingState from "../../components/LoadingState";

export default function PeriodsPanel() {
  const { data: periods, isLoading } = useFinancialPeriods();
  const closePeriod = useClosePeriod();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleClose = async (id: string) => {
    try {
      await closePeriod.mutateAsync(id);
      toast.success("Period closed. All entries in it are now locked.");
      setConfirmingId(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to close period"));
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Financial Periods</h2>
      <p className="text-sm text-slate-500 mb-4">
        Closing a period locks every journal entry in it against edit, delete, and restore.
      </p>

      {isLoading && <LoadingState label="Loading periods..." />}

      {periods && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Start</th>
                <th className="px-5 py-3 font-medium">End</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-medium text-slate-900">{p.name}</td>
                  <td className="px-5 py-3 text-slate-600">{p.start_date}</td>
                  <td className="px-5 py-3 text-slate-600">{p.end_date}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        p.status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {p.status === "open" &&
                      (confirmingId === p.id ? (
                        <div className="flex justify-end gap-2 items-center">
                          <span className="text-xs text-red-600">This cannot be undone. Confirm?</span>
                          <button
                            onClick={() => handleClose(p.id)}
                            disabled={closePeriod.isPending}
                            className="text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1.5 disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button onClick={() => setConfirmingId(null)} className="text-xs text-slate-500">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmingId(p.id)}
                          className="flex items-center gap-1 text-violet-600 text-xs font-medium ml-auto"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Close period
                        </button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}