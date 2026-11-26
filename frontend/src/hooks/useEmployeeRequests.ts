import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { getActiveOrganizationId } from "../lib/activeOrganization";
import type {
  ApproveEmployeeRequestPayload,
  CreateEmployeeRequestPayload,
  EmployeeRequest,
  EmployeeRequestApproval,
} from "../types/employeeRequest";

export function useEmployeeRequests() {
  const organizationId = getActiveOrganizationId();
  return useQuery({
    queryKey: ["employeeRequests", organizationId],
    queryFn: async () => {
      const { data } = await apiClient.get<EmployeeRequest[]>("/employee-requests");
      return data;
    },
  });
}

export function useCreateEmployeeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateEmployeeRequestPayload) => {
      const { data } = await apiClient.post<EmployeeRequest>("/employee-requests", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeRequests"] });
    },
  });
}

export function useApproveEmployeeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ApproveEmployeeRequestPayload) => {
      const { id, ...body } = payload;
      const { data } = await apiClient.post<EmployeeRequestApproval>(`/employee-requests/${id}/approve`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeRequests"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["payrollProfiles"] });
    },
  });
}

export function useRejectEmployeeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, decision_note }: { id: string; decision_note?: string | null }) => {
      const { data } = await apiClient.post<EmployeeRequest>(`/employee-requests/${id}/reject`, {
        decision_note: decision_note ?? null,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeRequests"] });
    },
  });
}