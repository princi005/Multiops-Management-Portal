import { useState } from "react";
import { Users, Pencil, UserPlus } from "lucide-react";
import { useEmployees } from "../../hooks/useEmployees";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import PortalHeader from "../../components/PortalHeader";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import EmployeeEditPanel from "./EmployeeEditPanel";
import AddEmployeePanel from "./AddEmployeePanel";
import type { Employee } from "../../types/employee";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  on_leave: "bg-amber-50 text-amber-700",
  inactive: "bg-slate-100 text-slate-600",
  terminated: "bg-red-50 text-red-700",
};

export default function EmployeeListPage() {
  const { data: user } = useCurrentUser();
  const { data: employees, isLoading, isError, refetch } = useEmployees();
  const [editing, setEditing] = useState<Employee | null>(null);
  const [adding, setAdding] = useState(false);

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
            Add Employee
          </button>
        </div>

        {isLoading && <LoadingState label="Loading employees..." />}
        {isError && (
          <ErrorState message="Failed to load employees." onRetry={() => refetch()} />
        )}

        {employees && employees.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <EmptyState
              icon={Users}
              title="No employees yet"
              description="Employees will appear here once added."
            />
          </div>
        )}

        {employees && employees.length > 0 && (
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
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {emp.employee_code}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{emp.designation ?? "-"}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {emp.department?.name ?? "-"}
                    </td>
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
      </main>

      {editing && (
        <EmployeeEditPanel employee={editing} onClose={() => setEditing(null)} />
      )}
      {adding && <AddEmployeePanel onClose={() => setAdding(false)} />}
    </div>
  );
}