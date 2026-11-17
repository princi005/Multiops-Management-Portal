import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type {
  Ticket,
  TicketCreatePayload,
  TicketLog,
  TicketStatus,
  TicketUpdatePayload,
} from "../types/project";

export function useTickets(projectId: string) {
  return useQuery({
    queryKey: ["tickets", projectId],
    queryFn: async () => {
      const { data } = await apiClient.get<Ticket[]>(`/projects/${projectId}/tickets`);
      return data;
    },
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, payload }: { projectId: string; payload: TicketCreatePayload }) => {
      const { data } = await apiClient.post<Ticket>(`/projects/${projectId}/tickets`, payload);
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tickets", vars.projectId] });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ticketId,
      payload,
    }: {
      projectId: string;
      ticketId: string;
      payload: TicketUpdatePayload;
    }) => {
      const { data } = await apiClient.patch<Ticket>(`/tickets/${ticketId}`, payload);
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tickets", vars.projectId] });
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ticketId,
      status,
      note,
    }: {
      projectId: string;
      ticketId: string;
      status: TicketStatus;
      note?: string | null;
    }) => {
      const { data } = await apiClient.patch<Ticket>(`/tickets/${ticketId}/status`, {
        status,
        note: note ?? null,
      });
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tickets", vars.projectId] });
      queryClient.invalidateQueries({ queryKey: ["ticket-logs", vars.ticketId] });
    },
  });
}

export function useTicketLogs(ticketId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["ticket-logs", ticketId],
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.get<TicketLog[]>(`/tickets/${ticketId}/logs`);
      return data;
    },
  });
}

export function useAddTicketLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, note }: { projectId: string; ticketId: string; note: string }) => {
      const { data } = await apiClient.post<Ticket>(`/tickets/${ticketId}/logs`, { note });
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-logs", vars.ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets", vars.projectId] });
    },
  });
}