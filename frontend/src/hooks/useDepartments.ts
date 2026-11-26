import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { getActiveOrganizationId } from "../lib/activeOrganization";
import type { Department } from "../types/employee";

export function useDepartments() {
  const organizationId = getActiveOrganizationId();
  return useQuery({
    queryKey: ["departments", organizationId],
    queryFn: async () => {
      const { data } = await apiClient.get<Department[]>("/departments");
      return data;
    },
  });
}