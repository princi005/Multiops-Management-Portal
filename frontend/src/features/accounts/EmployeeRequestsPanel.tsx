import { Fragment, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Copy, Inbox, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  useApproveEmployeeRequest,
  useEmployeeRequests,
  useRejectEmployeeRequest,
} from "../../hooks/useEmployeeRequests";
import { useDepartments } from "../../hooks/useDepartments";
import { getErrorMessage } from "../../lib/errors";
import { filterRequests, requestTitle, sortRequests } from "../../lib/employeeRequestFormat";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import RequestStatusBadge from "../../components/RequestStatusBadge";
import RequestFilterBar from "../../components/RequestFilterBar";
import KeyValueEditor, { recordToRows, rowsToRecord, type KeyValueRow } from "../../components/KeyValueEditor";
import type { EmployeeRequest, RequestStatus } from "../../types/employeeRequest";

function RequestDetails({ request }: { request: EmployeeRequest }) {
  const { data: departments } = useDepartments();
  const p = request.payload;

  const rows: [string, string][] =
    request.request_type === "creation"
      ? [
          ["Full name", String(p.full_name ?? "-")],
          ["Email", String(p.email ?? "-")],
          ["Employee code", String(p.employee_code ?? "-")],
          ["Designation", p.designation ? String(p.designation) : "-"],
          ["Phone", p.phone ? String(p.phone) : "-"],
          [
            "Department",
            p.department_id
              ? (departments?.find((d) => d.id === p.department_id)?.name ?? String(p.department_id))
              : "-",
          ],
          [
            "Proposed basic salary",
            p.proposed_basic_salary ? String(p.proposed_basic_salary) : "Not specified by HR",
          ],
        ]
      : [
          ["Employee code", String(p.employee_code ?? "-")],
          ["Reason", p.reason ? String(p.reason) : "-"],
        ];

  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-t border-slate-100 first:border-0">
            <td className="py-2 pr-4 text-slate-500 w-48">{label}</td>
            <td className="py-2 text-slate-900">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface PayrollDecisionState {
  basicSalary: number;
  allowanceRows: KeyValueRow[];
  deductionRows: KeyValueRow[];
  benefitRows: KeyValueRow[];
  pan: string;
  bankAccount: string;
  ifsc: string;
  effectiveDate: string;
}

function emptyPayrollState(proposedSalary: number): PayrollDecisionState {
  return {
    basicSalary: proposedSalary,
    allowanceRows: [],
    deductionRows: [],
    benefitRows: [],
    pan: "",
    bankAccount: "",
    ifsc: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
  };
}

export default function EmployeeRequestsPanel() {
  const { data: requests, isLoading, isError, refetch } = useEmployeeRequests();
  const approve = useApproveEmployeeRequest();
  const reject = useRejectEmployeeRequest();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [note, setNote] = useState("");
  const [payroll, setPayroll] = useState<PayrollDecisionState | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const visibleRequests = useMemo(() => {
    if (!requests) return [];
    return sortRequests(filterRequests(requests, search, statusFilter));
  }, [requests, search, statusFilter]);

  const startDeciding = (request: EmployeeRequest, action: "approve" | "reject") => {
    setDeciding({ id: request.id, action });
    setNote("");
    if (action === "approve" && request.request_type === "creation") {
      const proposed = Number(request.payload.proposed_basic_salary) || 0;
      setPayroll(emptyPayrollState(proposed));
    } else {
      setPayroll(null);
    }
  };

  const closeDecision = () => {
    setDeciding(null);
    setNote("");
    setPayroll(null);
  };

  const confirmDecision = async (request: EmployeeRequest) => {
    if (!deciding) return;

    if (deciding.action === "approve" && request.request_type === "creation") {
      if (!payroll || payroll.basicSalary <= 0) {
        toast.error("Enter a basic salary before approving.");
        return;
      }
    }

    try {
      if (deciding.action === "approve") {
        const result = await approve.mutateAsync({
          id: request.id,
          decision_note: note || null,
          ...(payroll
            ? {
                basic_salary: payroll.basicSalary,
                allowances: rowsToRecord(payroll.allowanceRows),
                deductions: rowsToRecord(payroll.deductionRows),
                benefits: rowsToRecord(payroll.benefitRows),
                pan: payroll.pan || null,
                bank_account_number: payroll.bankAccount || null,
                ifsc: payroll.ifsc || null,
                effective_date: payroll.effectiveDate,
              }
            : {}),
        });
        toast.success("Request approved");
        if (result.temporary_password) {
          setCredentials({ email: String(request.payload.email ?? ""), password: result.temporary_password });
        }
      } else {
        await reject.mutateAsync({ id: request.id, decision_note: note || null });
        toast.success("Request rejected");
      }
      closeDecision();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not complete this action"));
    }
  };

  const copyPassword = async () => {
    if (!credentials) return;
    await navigator.clipboard.writeText(credentials.password);
    toast.success("Copied");
  };

  const busy = approve.isPending || reject.isPending;

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Employee Requests</h2>
      <p className="text-sm text-slate-500 mb-4">
        HR submits new-hire and exit requests here. Click a name to see full details. Nothing is created or
        changed until you approve.
      </p>

      {credentials && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-emerald-800">Login created for {credentials.email}</p>
          <p className="text-xs text-emerald-700 mt-1">
            Share this temporary password securely. It is shown only once and is not stored anywhere.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <code className="bg-white border border-emerald-200 rounded px-3 py-1.5 text-sm text-slate-900">
              {credentials.password}
            </code>
            <button onClick={copyPassword} className="flex items-center gap-1 text-sm text-emerald-700 font-medium">
              <Copy className="w-4 h-4" />
              Copy
            </button>
            <button onClick={() => setCredentials(null)} className="text-sm text-slate-600 ml-auto">
              Done
            </button>
          </div>
        </div>
      )}

      {isLoading && <LoadingState label="Loading requests..." />}
      {isError && <ErrorState message="Failed to load requests." onRetry={() => refetch()} />}

      {requests && requests.length > 0 && (
        <RequestFilterBar
          search={search}
          onSearchChange={setSearch}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          accent="violet"
        />
      )}

      {requests && requests.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <Inbox className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No requests yet.</p>
        </div>
      )}

      {requests && requests.length > 0 && visibleRequests.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <p className="text-sm text-slate-500">No requests match this filter.</p>
        </div>
      )}

      {visibleRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Submitted</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {visibleRequests.map((r) => {
                const isOpen = expanded === r.id;
                const isDecidingThis = deciding?.id === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr
                      className="border-t border-slate-100 cursor-pointer hover:bg-slate-50"
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                    >
                      <td className="px-5 py-3 text-slate-900 font-medium flex items-center gap-2">
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                        {requestTitle(r)}
                      </td>
                      <td className="px-5 py-3">
                        <RequestStatusBadge status={r.status} />
                      </td>
                      <td className="px-5 py-3 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {r.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => startDeciding(r, "approve")}
                              className="flex items-center gap-1 text-emerald-700 text-sm font-medium"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => startDeciding(r, "reject")}
                              className="flex items-center gap-1 text-red-600 text-sm font-medium"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="bg-slate-50 border-t border-slate-100">
                        <td colSpan={4} className="px-5 py-4">
                          <RequestDetails request={r} />
                          {r.decision_note && (
                            <p className="text-xs text-slate-500 mt-3">
                              <span className="font-medium">Accounts note:</span> {r.decision_note}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}

                    {isDecidingThis && (
                      <tr className="bg-slate-50 border-t border-slate-100">
                        <td colSpan={4} className="px-5 py-4">
                          {payroll && (
                            <div className="mb-4 space-y-3 bg-white border border-slate-200 rounded-lg p-4">
                              <p className="text-xs font-semibold text-slate-700">
                                Payroll terms - edit HR's proposed figure if needed
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-slate-600">Basic salary</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={payroll.basicSalary || ""}
                                    onChange={(e) =>
                                      setPayroll({ ...payroll, basicSalary: Number(e.target.value) || 0 })
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-600">Effective date</label>
                                  <input
                                    type="date"
                                    value={payroll.effectiveDate}
                                    onChange={(e) => setPayroll({ ...payroll, effectiveDate: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs text-slate-600">PAN</label>
                                  <input
                                    value={payroll.pan}
                                    onChange={(e) => setPayroll({ ...payroll, pan: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-600">Bank account</label>
                                  <input
                                    value={payroll.bankAccount}
                                    onChange={(e) => setPayroll({ ...payroll, bankAccount: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-600">IFSC</label>
                                  <input
                                    value={payroll.ifsc}
                                    onChange={(e) => setPayroll({ ...payroll, ifsc: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <KeyValueEditor
                                  title="Allowances"
                                  rows={payroll.allowanceRows}
                                  onChange={(rows) => setPayroll({ ...payroll, allowanceRows: rows })}
                                />
                                <KeyValueEditor
                                  title="Deductions"
                                  rows={payroll.deductionRows}
                                  onChange={(rows) => setPayroll({ ...payroll, deductionRows: rows })}
                                />
                                <KeyValueEditor
                                  title="Benefits"
                                  rows={payroll.benefitRows}
                                  onChange={(rows) => setPayroll({ ...payroll, benefitRows: rows })}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder={
                                deciding.action === "approve" ? "Note (optional)" : "Reason for rejection (optional)"
                              }
                              className="flex-1 min-w-[220px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <button onClick={closeDecision} className="text-sm text-slate-600 px-3 py-2">
                              Cancel
                            </button>
                            <button
                              onClick={() => confirmDecision(r)}
                              disabled={busy}
                              className={`text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50 ${
                                deciding.action === "approve"
                                  ? "bg-emerald-600 hover:bg-emerald-700"
                                  : "bg-red-600 hover:bg-red-700"
                              }`}
                            >
                              {busy
                                ? "Working..."
                                : deciding.action === "approve"
                                  ? "Confirm approval"
                                  : "Confirm rejection"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}