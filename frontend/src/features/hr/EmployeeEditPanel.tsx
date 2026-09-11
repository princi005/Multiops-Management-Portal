import { useState } from "react";
import toast from "react-hot-toast";
import { useDepartments } from "../../hooks/useDepartments";
import { useUpdateEmployee, useDeactivateEmployee } from "../../hooks/useEmployees";
import type { Employee, EmploymentStatus } from "../../types/employee";

const STATUS_OPTIONS: EmploymentStatus[] = ["active", "on_leave", "inactive", "terminated"];

export default function EmployeeEditPanel({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const { data: departments } = useDepartments();
  const updateEmployee = useUpdateEmployee();
  const deactivateEmployee = useDeactivateEmployee();

  const [designation, setDesignation] = useState(employee.designation ?? "");
  const [phone, setPhone] = useState(employee.phone ?? "");
  const [departmentId, setDepartmentId] = useState(employee.department_id ?? "");
  const [status, setStatus] = useState<EmploymentStatus>(employee.employment_status);

  const handleSave = async () => {
    try {
      await updateEmployee.mutateAsync({
        id: employee.id,
        payload: {
          designation: designation || null,
          phone: phone || null,
          department_id: departmentId || null,
          employment_status: status,
        },
      });
      toast.success("Employee updated");
      onClose();
    } catch {
      toast.error("Failed to update employee");
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivateEmployee.mutateAsync(employee.id);
      toast.success("Employee deactivated");
      onClose();
    } catch {
      toast.error("Failed to deactivate employee");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Edit {employee.employee_code}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700">Designation</label>
            <input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">— None —</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EmploymentStatus)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={handleDeactivate}
            disabled={deactivateEmployee.isPending}
            className="text-red-600 text-sm underline disabled:opacity-50"
          >
            Deactivate
          </button>
          <div className="space-x-2">
            <button onClick={onClose} className="text-sm text-gray-600 px-3 py-2">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateEmployee.isPending}
              className="bg-gray-900 text-white text-sm rounded px-4 py-2 disabled:opacity-50"
            >
              {updateEmployee.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}