import { useMemo, useState } from "react";
import { ClipboardList, Pencil, UserPlus, Users } from "lucide-react";
import { useEmployees } from "../../hooks/useEmployees";
import { useEmployeeRequests } from "../../hooks/useEmployeeRequests";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { describeRequest, filterRequests, sortRequests } from "../../lib/employeeRequestFormat";
import { sortEmployees } from "../../lib/employeeFormat";
import PortalHeader from "../../components/PortalHeader";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import RequestStatusBadge from "../../components/RequestStatusBadge";
import RequestFilterBar from "../../components/RequestFilterBar";
import EmployeeEditPanel from "./EmployeeEditPanel";
import AddEmployeePanel from "./AddEmployeePanel";
import ProfileChangeRequestsSection from "./ProfileChangeRequestsSection";
import type { Employee } from "../../types/employee";
import type { RequestStatus } from "../../types/employeeRequest";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  on_leave: "bg-amber-50 text-amber-700",
  inactive: "bg-slate-100 text-slate-600",
  terminated: "bg-red-50 text-red-700",
};

export default function EmployeeListPage() {
  const { data: user } = useCurrentUser();
  const { data: employees, isLoading, isError, refetch } = useEmployees();
  const { data: requests } = useEmployeeRequests();
  const [editing, setEditing] = useState<Employee | null>(null);
  const [adding, setAdding] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");

  const sortedEmployees = useMemo(() => (employees ? sortEmployees(employees) : []), [employees]);

  const visibleRequests = useMemo(() => {
    if (!requests) return [];
    return sortRequests(filterRequests(requests, search, statusFilter));
  }, [requests, search, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader title="HR Portal" subtitle="People & Departments" email={user?.email} accent="teal" />
      <main className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Employees</h2>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg px-4 py-2"
          >
            <UserPlus className="w-4 h-4" />
            Request New Employee
          </button>
        </div>

        {isLoading && <LoadingState label="Loading employees..." />}
        {isError && <ErrorState message="Failed to load employees." onRetry={() => refetch()} />}

        {sortedEmployees.length === 0 && employees && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <EmptyState
              icon={Users}
              title="No employees yet"
              description="Employees appear here once Accounts approves a request."
            />
          </div>
        )}

        {sortedEmployees.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 font-medium">Code</th>
                  <th className="px-5 py-3 font-medium">Designation</th>
                  <th className="px-5 py-3 font-medium">Department</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sortedEmployees.map((emp) => (
                  <tr key={emp.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{emp.employee_code}</td>
                    <td className="px-5 py-3 text-slate-600">{emp.designation ?? "-"}</td>
                    <td className="px-5 py-3 text-slate-600">{emp.department?.name ?? "-"}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          STATUS_STYLES[emp.employment_status] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {emp.employment_status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{emp.phone ?? "-"}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setEditing(emp)}
                        className="flex items-center gap-1 text-teal-600 text-sm font-medium ml-auto hover:text-teal-700"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Employee Requests</h2>

          {requests && requests.length > 0 && (
            <RequestFilterBar
              search={search}
              onSearchChange={setSearch}
              status={statusFilter}
              onStatusChange={setStatusFilter}
              accent="teal"
            />
          )}

          {requests && requests.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <EmptyState
                icon={ClipboardList}
                title="No requests yet"
                description="Requests you send to Accounts, and their decisions, appear here."
              />
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
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Details</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Accounts note</th>
                    <th className="px-5 py-3 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRequests.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="px-5 py-3 text-slate-900 capitalize">{r.request_type}</td>
                      <td className="px-5 py-3 text-slate-600">{describeRequest(r)}</td>
                      <td className="px-5 py-3">
                        <RequestStatusBadge status={r.status} />
                      </td>
                      <td className="px-5 py-3 text-slate-600">{r.decision_note ?? "-"}</td>
                      <td className="px-5 py-3 text-slate-500">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <ProfileChangeRequestsSection />
      </main>

      {editing && <EmployeeEditPanel employee={editing} onClose={() => setEditing(null)} />}
      {adding && <AddEmployeePanel onClose={() => setAdding(false)} />}
    </div>
  );
}