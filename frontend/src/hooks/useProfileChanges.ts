import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type {
  ChangeRequest,
  ChangeRequestForHr,
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

// ---- HR ----

export function useChangeRequestsForHr(status: ChangeStatus | "all") {
  return useQuery({
    queryKey: ["change-requests", status],
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