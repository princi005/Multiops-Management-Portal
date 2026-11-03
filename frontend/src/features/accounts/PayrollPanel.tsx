import { useState } from "react";
import { Download, History, KeyRound, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import {
  downloadPayrollExcel,
  usePayrollProfiles,
  useSalaryHistory,
  useUpdatePayrollProfile,
} from "../../hooks/usePayroll";
import { useResetEmployeePassword } from "../../hooks/useEmployees";
import { getErrorMessage } from "../../lib/errors";
import LoadingState from "../../components/LoadingState";
import KeyValueEditor, { recordToRows, rowsToRecord, type KeyValueRow } from "../../components/KeyValueEditor";
import type { PayrollProfileWithEmployee } from "../../types/payroll";

function sumValues(record: Record<string, number>): number {
  return Object.values(record).reduce((a, b) => a + b, 0);
}

function HistoryDialog({ profile, onClose }: { profile: PayrollProfileWithEmployee; onClose: () => void }) {
  const { data: history, isLoading } = useSalaryHistory(profile.employee_id);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center px-4 z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Salary history</h2>
            <p className="text-xs text-slate-500">{profile.employee_code}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">
            Close
          </button>
        </div>

        {isLoading && <LoadingState label="Loading history..." />}

        <div className="space-y-3">
          {history?.map((h) => (
            <div key={h.id} className="border border-slate-200 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-slate-900 capitalize">{h.action}</span>
                <span className="text-xs text-slate-500">
                  {h.changed_by_email ?? "unknown"} | {new Date(h.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">Reason: {h.reason}</p>
              <p className="text-xs text-slate-600">Effective: {h.effective_date}</p>
              <p className="text-slate-900 mt-1">Basic salary: {h.basic_salary.toFixed(2)}</p>
            </div>
          ))}
          {history && history.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">No history yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function EditDialog({ profile, onClose }: { profile: PayrollProfileWithEmployee; onClose: () => void }) {
  const updateProfile = useUpdatePayrollProfile();

  const [basicSalary, setBasicSalary] = useState(profile.basic_salary);
  const [allowanceRows, setAllowanceRows] = useState<KeyValueRow[]>(recordToRows(profile.allowances));
  const [deductionRows, setDeductionRows] = useState<KeyValueRow[]>(recordToRows(profile.deductions));
  const [benefitRows, setBenefitRows] = useState<KeyValueRow[]>(recordToRows(profile.benefits));
  const [pan, setPan] = useState(profile.pan ?? "");
  const [bankAccount, setBankAccount] = useState(profile.bank_account_number ?? "");
  const [ifsc, setIfsc] = useState(profile.ifsc ?? "");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        employeeId: profile.employee_id,
        payload: {
          basic_salary: basicSalary,
          pay_frequency: "monthly",
          allowances: rowsToRecord(allowanceRows),
          deductions: rowsToRecord(deductionRows),
          benefits: rowsToRecord(benefitRows),
          pan: pan || null,
          bank_account_number: bankAccount || null,
          ifsc: ifsc || null,
          effective_date: effectiveDate,
          reason: reason.trim(),
        },
      });
      toast.success("Payroll profile updated, change recorded in history");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update payroll profile"));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center px-4 z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Update payroll: {profile.employee_code}</h2>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm text-slate-700">Basic salary</label>
            <input
              type="number"
              min="0"
              value={basicSalary}
              onChange={(e) => setBasicSalary(Number(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700">Effective date</label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-sm text-slate-700">PAN</label>
            <input value={pan} onChange={(e) => setPan(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-slate-700">Bank account</label>
            <input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-slate-700">IFSC</label>
            <input value={ifsc} onChange={(e) => setIfsc(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <KeyValueEditor title="Allowances" rows={allowanceRows} onChange={setAllowanceRows} />
          <KeyValueEditor title="Deductions" rows={deductionRows} onChange={setDeductionRows} />
          <KeyValueEditor title="Benefits" rows={benefitRows} onChange={setBenefitRows} />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-slate-700">Reason for change (required)</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Annual increment"
            className={inputClass}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-slate-600 px-3 py-2">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={reason.trim().length < 3 || updateProfile.isPending}
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50"
          >
            {updateProfile.isPending ? "Saving..." : "Save & record history"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PayrollPanel() {
  const { data: profiles, isLoading } = usePayrollProfiles();
  const resetPassword = useResetEmployeePassword();
  const [historyFor, setHistoryFor] = useState<PayrollProfileWithEmployee | null>(null);
  const [editing, setEditing] = useState<PayrollProfileWithEmployee | null>(null);
  const [exporting, setExporting] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ email: string; password: string } | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadPayrollExcel();
    } catch {
      toast.error("Failed to export");
    } finally {
      setExporting(false);
    }
  };

  const handleResetPassword = async (employeeId: string) => {
    try {
      const result = await resetPassword.mutateAsync(employeeId);
      setNewCredentials({ email: result.email, password: result.temporary_password });
      toast.success("Password reset");
    } catch {
      toast.error("Failed to reset password");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-slate-900">Payroll</h2>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exporting ? "Exporting..." : "Export to Excel"}
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Current salary configuration per employee. Every change is recorded in that employee's history, never
        overwritten silently.
      </p>

      {newCredentials && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-emerald-800">New password for {newCredentials.email}</p>
          <p className="text-xs text-emerald-700 mt-1">Shown once. Share it securely; it is not stored anywhere.</p>
          <div className="flex items-center gap-2 mt-3">
            <code className="bg-white border border-emerald-200 rounded px-3 py-1.5 text-sm text-slate-900">
              {newCredentials.password}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(newCredentials.password)}
              className="text-sm text-emerald-700 font-medium"
            >
              Copy
            </button>
            <button onClick={() => setNewCredentials(null)} className="text-sm text-slate-600 ml-auto">
              Done
            </button>
          </div>
        </div>
      )}

      {isLoading && <LoadingState label="Loading payroll..." />}

      {profiles && profiles.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <p className="text-sm text-slate-500">No payroll profiles yet.</p>
        </div>
      )}

      {profiles && profiles.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Designation</th>
                <th className="px-5 py-3 font-medium text-right">Basic Salary</th>
                <th className="px-5 py-3 font-medium text-right">Allowances</th>
                <th className="px-5 py-3 font-medium text-right">Deductions</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-medium text-slate-900">{p.employee_code}</td>
                  <td className="px-5 py-3 text-slate-600">{p.employee_designation ?? "-"}</td>
                  <td className="px-5 py-3 text-right text-slate-900">{p.basic_salary.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{sumValues(p.allowances).toFixed(2)}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{sumValues(p.deductions).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        p.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setHistoryFor(p)}
                        className="text-slate-500 hover:text-slate-800 text-xs font-medium flex items-center gap-1"
                      >
                        <History className="w-3.5 h-3.5" />
                        History
                      </button>
                      <button
                        onClick={() => setEditing(p)}
                        className="text-violet-600 hover:text-violet-800 text-xs font-medium flex items-center gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleResetPassword(p.employee_id)}
                        disabled={resetPassword.isPending}
                        className="text-amber-600 hover:text-amber-800 text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Reset password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {historyFor && <HistoryDialog profile={historyFor} onClose={() => setHistoryFor(null)} />}
      {editing && <EditDialog profile={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}