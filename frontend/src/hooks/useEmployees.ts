import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { getActiveOrganizationId } from "../lib/activeOrganization";
import type { Employee, EmployeeOnboardPayload, EmployeeUpdatePayload } from "../types/employee";

export function useEmployees() {
  const organizationId = getActiveOrganizationId();
  return useQuery({
    queryKey: ["employees", organizationId],
    queryFn: async () => {
      const { data } = await apiClient.get<Employee[]>("/employees");
      return data;
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: EmployeeUpdatePayload }) => {
      const { data } = await apiClient.patch<Employee>(`/employees/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDeactivateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<Employee>(`/employees/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useOnboardEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EmployeeOnboardPayload) => {
      const { data } = await apiClient.post<Employee>("/employees/onboard", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useResetEmployeePassword() {
  return useMutation({
    mutationFn: async (employeeId: string) => {
      const { data } = await apiClient.post<{ employee_id: string; email: string; temporary_password: string }>(
        `/employees/${employeeId}/reset-password`
      );
      return data;
    },
  });
}