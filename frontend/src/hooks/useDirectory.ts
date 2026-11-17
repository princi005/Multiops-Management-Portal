import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { DirectoryEmployee } from "../types/project";

// Active employees (names + codes only). Manager role only.
export function useDirectory() {
  return useQuery({
    queryKey: ["directory", "employees"],
    queryFn: async () => {
      const { data } = await apiClient.get<DirectoryEmployee[]>("/directory/employees");
      return data;
    },
  });
}