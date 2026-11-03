import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type {
  PayrollProfile,
  PayrollProfileUpdatePayload,
  PayrollProfileWithEmployee,
  SalaryHistoryEntry,
} from "../types/payroll";

export function usePayrollProfiles() {
  return useQuery({
    queryKey: ["payrollProfiles"],
    queryFn: async () => {
      const { data } = await apiClient.get<PayrollProfileWithEmployee[]>("/payroll/profiles");
      return data;
    },
  });
}

export function useSalaryHistory(employeeId: string | null) {
  return useQuery({
    queryKey: ["salaryHistory", employeeId],
    queryFn: async () => {
      const { data } = await apiClient.get<SalaryHistoryEntry[]>(`/payroll/profiles/${employeeId}/history`);
      return data;
    },
    enabled: employeeId !== null,
  });
}

export function useUpdatePayrollProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, payload }: { employeeId: string; payload: PayrollProfileUpdatePayload }) => {
      const { data } = await apiClient.patch<PayrollProfile>(`/payroll/profiles/${employeeId}`, payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payrollProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["salaryHistory", variables.employeeId] });
    },
  });
}

export async function downloadPayrollExcel() {
  const response = await apiClient.get("/payroll/export", { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = "payroll_export.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}