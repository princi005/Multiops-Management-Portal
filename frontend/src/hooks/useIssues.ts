import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type {
  CreateIssuePayload,
  Issue,
  IssueForAccounts,
  IssueStatus,
  RespondToIssuePayload,
} from "../types/issue";

// Employee portal polls so Accounts responses saved in another session
// appear without requiring a manual browser refresh.
export function useMyIssues() {
  return useQuery({
    queryKey: ["me", "issues"],
    queryFn: async () => {
      const { data } = await apiClient.get<Issue[]>("/me/issues");
      return data;
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateIssuePayload) => {
      const { data } = await apiClient.post<Issue>("/me/issues", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "issues"] });
    },
  });
}

export function useWithdrawIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<Issue>(`/me/issues/${id}/withdraw`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "issues"] });
    },
  });
}

// Accounts
export function useIssuesForAccounts(status: IssueStatus | "all") {
  return useQuery({
    queryKey: ["issues", status],
    queryFn: async () => {
      const { data } = await apiClient.get<IssueForAccounts[]>("/issues", {
        params: status === "all" ? undefined : { status },
      });
      return data;
    },
  });
}

export function useRespondToIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, response }: RespondToIssuePayload) => {
      const { data } = await apiClient.post<IssueForAccounts>(`/issues/${id}/respond`, {
        status,
        response: response ?? null,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["me", "issues"] });
    },
  });
}
