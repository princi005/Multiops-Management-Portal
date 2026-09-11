import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

interface MeResponse {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  roles: string[];
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data } = await apiClient.get<MeResponse>("/auth/me");
      return data;
    },
  });
}