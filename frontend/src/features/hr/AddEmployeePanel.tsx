import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useDepartments } from "../../hooks/useDepartments";
import { useCreateEmployeeRequest } from "../../hooks/useEmployeeRequests";
import { getErrorMessage } from "../../lib/errors";

const requestSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  employee_code: z.string().min(1, "Employee code is required"),
  designation: z.string().optional(),
  phone: z.string().optional(),
  department_id: z.string().optional(),
  proposed_basic_salary: z
    .string()
    .optional()
    .refine((v) => !v || Number(v) > 0, "Enter a positive number"),
});

type RequestForm = z.infer<typeof requestSchema>;

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

export default function AddEmployeePanel({ onClose }: { onClose: () => void }) {
  const { data: departments } = useDepartments();
  const createRequest = useCreateEmployeeRequest();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestForm>({ resolver: zodResolver(requestSchema) });

  const onSubmit = async (values: RequestForm) => {
    try {
      await createRequest.mutateAsync({
        request_type: "creation",
        payload: {
          full_name: values.full_name,
          email: values.email,
          employee_code: values.employee_code,
          designation: values.designation || null,
          phone: values.phone || null,
          department_id: values.department_id || null,
          proposed_basic_salary: values.proposed_basic_salary ? Number(values.proposed_basic_salary) : null,
        },
      });
      toast.success("Request sent to Accounts for approval");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to submit request"));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center px-4 z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-slate-900">Request New Employee</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Accounts reviews this request and sets the final salary and payroll details. The login account is
          created only after approval.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-700">Full name</label>
            <input {...register("full_name")} className={inputClass} />
            {errors.full_name && <p className="text-red-600 text-xs mt-1">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-slate-700">Email</label>
            <input type="email" {...register("email")} className={inputClass} />
            {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-slate-700">Employee code</label>
            <input {...register("employee_code")} placeholder="EMP-XXX-001" className={inputClass} />
            {errors.employee_code && <p className="text-red-600 text-xs mt-1">{errors.employee_code.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-slate-700">Designation</label>
            <input {...register("designation")} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm text-slate-700">Phone</label>
            <input {...register("phone")} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm text-slate-700">Department</label>
            <select {...register("department_id")} className={inputClass}>
              <option value="">- None -</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-700">Proposed basic salary (optional)</label>
            <input
              type="number"
              min="0"
              {...register("proposed_basic_salary")}
              placeholder="e.g. 50000"
              className={inputClass}
            />
            {errors.proposed_basic_salary && (
              <p className="text-red-600 text-xs mt-1">{errors.proposed_basic_salary.message}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">Accounts can change this before approving.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="text-sm text-slate-600 px-3 py-2">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit for approval"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}