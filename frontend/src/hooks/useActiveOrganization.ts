import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { setActiveOrganizationId } from "../lib/activeOrganization";
import type { OrganizationMembership } from "../types/organization";

export function useMyOrganizations() {
  return useQuery({
    queryKey: ["organizations", "mine"],
    queryFn: async () => (await apiClient.get<OrganizationMembership[]>("/organizations/mine")).data,
  });
}

export function useSelectOrganization() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (organizationId: string) => {
      setActiveOrganizationId(organizationId);
      return (await apiClient.get<OrganizationMembership>("/organizations/active")).data;
    },
    onSuccess: async () => {
      await cache.invalidateQueries();
    },
  });
}
