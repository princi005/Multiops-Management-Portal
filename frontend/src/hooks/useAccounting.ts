import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type {
  AuditLog,
  FinancialPeriod,
  GLAccount,
  JournalEntry,
  JournalEntryCreatePayload,
  JournalEntryUpdatePayload,
  Party,
  PartyCreatePayload,
  PartyType,
  TrialBalanceReport,
} from "../types/accounting";

export function useGLAccounts() {
  return useQuery({
    queryKey: ["glAccounts"],
    queryFn: async () => {
      const { data } = await apiClient.get<GLAccount[]>("/gl/accounts");
      return data;
    },
  });
}

export function useFinancialPeriods() {
  return useQuery({
    queryKey: ["financialPeriods"],
    queryFn: async () => {
      const { data } = await apiClient.get<FinancialPeriod[]>("/gl/periods");
      return data;
    },
  });
}

export function useJournalEntries() {
  return useQuery({
    queryKey: ["journalEntries"],
    queryFn: async () => {
      const { data } = await apiClient.get<JournalEntry[]>("/gl/journal-entries");
      return data;
    },
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: JournalEntryCreatePayload) => {
      const { data } = await apiClient.post<JournalEntry>("/gl/journal-entries", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journalEntries"] });
      queryClient.invalidateQueries({ queryKey: ["trialBalance"] });
    },
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: JournalEntryUpdatePayload }) => {
      const { data } = await apiClient.put<JournalEntry>(`/gl/journal-entries/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journalEntries"] });
      queryClient.invalidateQueries({ queryKey: ["trialBalance"] });
      queryClient.invalidateQueries({ queryKey: ["journalEntryAudit"] });
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await apiClient.delete<JournalEntry>(`/gl/journal-entries/${id}`, {
        data: { reason },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journalEntries"] });
      queryClient.invalidateQueries({ queryKey: ["trialBalance"] });
      queryClient.invalidateQueries({ queryKey: ["journalEntryAudit"] });
    },
  });
}

export function useRestoreJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await apiClient.post<JournalEntry>(`/gl/journal-entries/${id}/restore`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journalEntries"] });
      queryClient.invalidateQueries({ queryKey: ["trialBalance"] });
      queryClient.invalidateQueries({ queryKey: ["journalEntryAudit"] });
    },
  });
}

export function useJournalEntryAudit(entryId: string | null) {
  return useQuery({
    queryKey: ["journalEntryAudit", entryId],
    queryFn: async () => {
      const { data } = await apiClient.get<AuditLog[]>(`/gl/journal-entries/${entryId}/audit-log`);
      return data;
    },
    enabled: entryId !== null,
  });
}

export function useParties(partyType?: PartyType) {
  return useQuery({
    queryKey: ["parties", partyType ?? "all"],
    queryFn: async () => {
      const { data } = await apiClient.get<Party[]>("/gl/parties", {
        params: partyType ? { party_type: partyType } : {},
      });
      return data;
    },
  });
}

export function useCreateParty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PartyCreatePayload) => {
      const { data } = await apiClient.post<Party>("/gl/parties", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parties"] });
    },
  });
}

export function useTrialBalance(periodId?: string) {
  return useQuery({
    queryKey: ["trialBalance", periodId],
    queryFn: async () => {
      const { data } = await apiClient.get<TrialBalanceReport>("/gl/reports/trial-balance", {
        params: { period_id: periodId },
      });
      return data;
    },
    enabled: !!periodId,
  });
} 

export function useClosePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (periodId: string) => {
      const { data } = await apiClient.post<FinancialPeriod>(`/gl/periods/${periodId}/close`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financialPeriods"] });
    },
  });
}                    