import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { OrganizationMembership } from "../types/organization";

export function useActiveOrganization() {
  return useQuery({
    queryKey: ["active-organization"],
    queryFn: async () => (await apiClient.get<OrganizationMembership>("/organizations/active")).data,
    retry: false,
  });
}
