import { useState } from "react";
import toast from "react-hot-toast";
import { useDepartments } from "../../hooks/useDepartments";
import { useUpdateEmployee } from "../../hooks/useEmployees";
import { useCreateEmployeeRequest } from "../../hooks/useEmployeeRequests";
import { getErrorMessage } from "../../lib/errors";
import type { Employee } from "../../types/employee";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

export default function EmployeeEditPanel({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const { data: departments } = useDepartments();
  const updateEmployee = useUpdateEmployee();
  const createRequest = useCreateEmployeeRequest();

  const [designation, setDesignation] = useState(employee.designation ?? "");
  const [phone, setPhone] = useState(employee.phone ?? "");
  const [departmentId, setDepartmentId] = useState(employee.department_id ?? "");

  const [exitMode, setExitMode] = useState(false);
  const [exitReason, setExitReason] = useState("");

  const alreadyExited = employee.employment_status === "inactive" || employee.employment_status === "terminated";

  const handleSave = async () => {
    try {
      await updateEmployee.mutateAsync({
        id: employee.id,
        payload: {
          designation: designation || null,
          phone: phone || null,
          department_id: departmentId || null,
        },
      });
      toast.success("Employee updated");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update employee"));
    }
  };

  const handleExitRequest = async () => {
    try {
      await createRequest.mutateAsync({
        request_type: "exit",
        payload: { employee_id: employee.id, reason: exitReason.trim() },
      });
      toast.success("Exit request sent to Accounts");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to send exit request"));
    }
  };

  if (exitMode) {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center px-4 z-50">
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Request exit: {employee.employee_code}</h2>
          <p className="text-xs text-slate-500 mb-4">
            Accounts reviews this request and handles the final settlement. Nothing changes until it is approved.
          </p>
          <label className="block text-sm text-slate-700">Reason</label>
          <textarea
            value={exitReason}
            onChange={(e) => setExitReason(e.target.value)}
            rows={3}
            className={inputClass}
          />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setExitMode(false)} className="text-sm text-slate-600 px-3 py-2">
              Back
            </button>
            <button
              onClick={handleExitRequest}
              disabled={exitReason.trim().length < 3 || createRequest.isPending}
              className="bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50"
            >
              {createRequest.isPending ? "Sending..." : "Send exit request"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Edit {employee.employee_code}</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-700">Designation</label>
            <input value={designation} onChange={(e) => setDesignation(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-slate-700">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-slate-700">Department</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={inputClass}>
              <option value="">- None -</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-700">Status</label>
            <p className="mt-1 text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              {employee.employment_status} - changed only through an exit request, decided by Accounts
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          {!alreadyExited ? (
            <button onClick={() => setExitMode(true)} className="text-red-600 text-sm underline">
              Request exit
            </button>
          ) : (
            <span className="text-xs text-slate-400">Already exited</span>
          )}
          <div className="space-x-2">
            <button onClick={onClose} className="text-sm text-slate-600 px-3 py-2">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateEmployee.isPending}
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50"
            >
              {updateEmployee.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}