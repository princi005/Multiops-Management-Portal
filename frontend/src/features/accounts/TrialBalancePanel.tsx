import { CheckCircle2, XCircle } from "lucide-react";
import { useFinancialPeriods, useTrialBalance } from "../../hooks/useAccounting";
import LoadingState from "../../components/LoadingState";

export default function TrialBalancePanel() {
  const { data: periods } = useFinancialPeriods();
  const openPeriod = periods?.find((p) => p.status === "open");
  const { data: report, isLoading } = useTrialBalance(openPeriod?.id);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-1">
        Trial Balance {report && `- ${report.period_name}`}
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Total debits must always equal total credits. If they ever differ, something is wrong in the ledger.
      </p>

      {isLoading && <LoadingState label="Calculating trial balance..." />}

      {report && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">Account</th>
                <th className="px-5 py-3 font-medium text-right">Debit</th>
                <th className="px-5 py-3 font-medium text-right">Credit</th>
                <th className="px-5 py-3 font-medium text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {report.lines.map((line) => (
                <tr key={line.gl_account_id} className="border-t border-slate-100">
                  <td className="px-5 py-3 text-slate-900">
                    {line.code} {line.name}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">
                    {line.total_debit > 0 ? line.total_debit.toFixed(2) : ""}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">
                    {line.total_credit > 0 ? line.total_credit.toFixed(2) : ""}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-slate-900">
                    {line.balance.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-semibold">
              <tr className="border-t border-slate-200">
                <td className="px-5 py-3 text-slate-900">Total</td>
                <td className="px-5 py-3 text-right text-slate-900">{report.total_debit.toFixed(2)}</td>
                <td className="px-5 py-3 text-right text-slate-900">{report.total_credit.toFixed(2)}</td>
                <td className="px-5 py-3 text-right">
                  {report.is_balanced ? (
                    <span className="flex items-center justify-end gap-1 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> Balanced
                    </span>
                  ) : (
                    <span className="flex items-center justify-end gap-1 text-red-600">
                      <XCircle className="w-4 h-4" /> Out of balance
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}