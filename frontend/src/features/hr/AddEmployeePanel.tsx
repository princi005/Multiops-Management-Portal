import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useDepartments } from "../../hooks/useDepartments";
import { useOnboardEmployee } from "../../hooks/useEmployees";

const onboardSchema = z.object({
  email: z.string().email("Enter a valid email"),
  full_name: z.string().min(1, "Full name is required"),
  temporary_password: z.string().min(6, "At least 6 characters"),
  employee_code: z.string().min(1, "Employee code is required"),
  designation: z.string().optional(),
  phone: z.string().optional(),
  department_id: z.string().optional(),
});

type OnboardForm = z.infer<typeof onboardSchema>;

export default function AddEmployeePanel({ onClose }: { onClose: () => void }) {
  const { data: departments } = useDepartments();
  const onboardEmployee = useOnboardEmployee();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardForm>({ resolver: zodResolver(onboardSchema) });

  const onSubmit = async (values: OnboardForm) => {
    try {
      await onboardEmployee.mutateAsync({
        email: values.email,
        full_name: values.full_name,
        temporary_password: values.temporary_password,
        employee_code: values.employee_code,
        designation: values.designation || null,
        phone: values.phone || null,
        department_id: values.department_id || null,
      });
      toast.success("Employee added");
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Failed to add employee");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Add Employee</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-700">Full name</label>
            <input
              {...register("full_name")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.full_name && (
              <p className="text-red-600 text-xs mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-700">Email</label>
            <input
              type="email"
              {...register("email")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.email && (
              <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-700">Temporary password</label>
            <input
              type="text"
              {...register("temporary_password")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.temporary_password && (
              <p className="text-red-600 text-xs mt-1">{errors.temporary_password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-700">Employee code</label>
            <input
              {...register("employee_code")}
              placeholder="EMP-XXX-001"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.employee_code && (
              <p className="text-red-600 text-xs mt-1">{errors.employee_code.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-700">Designation</label>
            <input
              {...register("designation")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-700">Phone</label>
            <input
              {...register("phone")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-700">Department</label>
            <select
              {...register("department_id")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">— None —</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-slate-600 px-3 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}