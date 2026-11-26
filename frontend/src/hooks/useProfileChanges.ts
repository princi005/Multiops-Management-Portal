import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { getActiveOrganizationId } from "../lib/activeOrganization";
import type {
  ChangeRequest,
  ChangeRequestForHr,
  ChangeEvidence,
  ChangeStatus,
  DecideChangeRequestPayload,
  SubmitChangeRequestPayload,
} from "../types/profileChange";

// ---- the employee's own requests ----

export function useMyChangeRequests() {
  return useQuery({
    queryKey: ["me", "change-requests"],
    queryFn: async () => {
      const { data } = await apiClient.get<ChangeRequest[]>("/me/change-requests");
      return data;
    },
  });
}

export function useSubmitChangeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubmitChangeRequestPayload) => {
      const { data } = await apiClient.post<ChangeRequest>("/me/change-requests", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "change-requests"] });
    },
  });
}

export function useCancelChangeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<ChangeRequest>(`/me/change-requests/${id}/cancel`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "change-requests"] });
    },
  });
}

export function useChangeEvidenceForHr(requestId: string) {
  return useQuery({
    queryKey: ["change-request-evidence", requestId],
    queryFn: async () => {
      const { data } = await apiClient.get<ChangeEvidence[]>(`/change-requests/${requestId}/evidence`);
      return data;
    },
    enabled: Boolean(requestId),
  });
}

export async function downloadChangeEvidenceForHr(requestId: string, evidenceId: string, filename: string) {
  const { data } = await apiClient.get<Blob>(
    `/change-requests/${requestId}/evidence/${evidenceId}/download`,
    { responseType: "blob" },
  );
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
// ---- HR ----

export function useChangeRequestsForHr(status: ChangeStatus | "all") {
  const organizationId = getActiveOrganizationId();
  return useQuery({
    queryKey: ["change-requests", organizationId, status],
    queryFn: async () => {
      const { data } = await apiClient.get<ChangeRequestForHr[]>("/change-requests", {
        params: status === "all" ? undefined : { status },
      });
      return data;
    },
  });
}

export function useDecideChangeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approve, decision_note }: DecideChangeRequestPayload) => {
      const { data } = await apiClient.post<ChangeRequestForHr>(
        `/change-requests/${id}/${approve ? "approve" : "reject"}`,
        { decision_note: decision_note ?? null },
      );
      return data;
    },
    onSuccess: () => {
      // An approved phone change also changes the HR employee table and the person's own profile.
      queryClient.invalidateQueries({ queryKey: ["change-requests"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}