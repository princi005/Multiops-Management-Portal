import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { Department } from "../types/employee";

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await apiClient.get<Department[]>("/departments");
      return data;
    },
  });
}