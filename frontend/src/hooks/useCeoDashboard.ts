import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { CeoDashboardSummary } from "../types/dashboard";

export function useCeoDashboard() {
  return useQuery({
    queryKey: ["ceoDashboard"],
    queryFn: async () => {
      const { data } = await apiClient.get<CeoDashboardSummary>("/dashboard/ceo");
      return data;
    },
  });
}