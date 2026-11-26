import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export interface CurrentUser {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  roles: string[];
  organization_roles: string[];
  is_platform_admin: boolean;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => (await apiClient.get<CurrentUser>("/auth/me")).data,
  });
}
