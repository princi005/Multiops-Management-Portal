import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { Organization, OrganizationAuditEntry, OrganizationConfig, OrganizationMember, OrganizationMembership } from "../types/organization";

export function useMyOrganizations() {
  return useQuery({ queryKey: ["organizations", "mine"], queryFn: async () =>
    (await apiClient.get<OrganizationMembership[]>("/organizations/mine")).data });
}
export function useOrganizationSettings(orgId: string | undefined) {
  return useQuery({ queryKey: ["organization-settings", orgId], enabled: Boolean(orgId), queryFn: async () =>
    (await apiClient.get<OrganizationConfig>(`/organizations/${orgId}/settings`)).data });
}
export function useSaveOrganizationSettings(orgId: string) {
  const cache = useQueryClient();
  return useMutation({ mutationFn: async (config: OrganizationConfig) =>
    (await apiClient.put<OrganizationConfig>(`/organizations/${orgId}/settings`, config)).data,
    onSuccess: (data) => cache.setQueryData(["organization-settings", orgId], data) });
}
export function useOrganizationMembers(orgId: string | undefined) {
  return useQuery({ queryKey: ["organization-members", orgId], enabled: Boolean(orgId), queryFn: async () =>
    (await apiClient.get<OrganizationMember[]>(`/organizations/${orgId}/members`)).data });
}
export function useAddOrganizationMember(orgId: string) {
  const cache = useQueryClient();
  return useMutation({ mutationFn: async (payload: { user_id: string; role: string }) =>
    (await apiClient.post<OrganizationMember>(`/organizations/${orgId}/members`, payload)).data,
    onSuccess: () => cache.invalidateQueries({ queryKey: ["organization-members", orgId] }) });
}
export function useUpdateOrganizationMember(orgId: string) {
  const cache = useQueryClient();
  return useMutation({ mutationFn: async (input: { id: string; role?: string; is_active?: boolean }) =>
    (await apiClient.patch<OrganizationMember>(`/organizations/${orgId}/members/${input.id}`, {
      role: input.role, is_active: input.is_active,
    })).data,
    onSuccess: () => cache.invalidateQueries({ queryKey: ["organization-members", orgId] }) });
}
export function useOrganizationAudit(orgId: string | undefined) {
  return useQuery({ queryKey: ["organization-audit", orgId], enabled: Boolean(orgId), queryFn: async () =>
    (await apiClient.get<OrganizationAuditEntry[]>(`/organizations/${orgId}/audit`)).data });
}
export function usePlatformOrganizations() {
  return useQuery({ queryKey: ["platform", "organizations"], queryFn: async () =>
    (await apiClient.get<Organization[]>("/platform/organizations")).data });
}
export function useCreateOrganization() {
  const cache = useQueryClient();
  return useMutation({ mutationFn: async (payload: { name: string; slug: string; initial_admin_user_id: string; domain?: string }) =>
    (await apiClient.post<Organization>("/platform/organizations", payload)).data,
    onSuccess: () => cache.invalidateQueries({ queryKey: ["platform", "organizations"] }) });
}
export function useUpdatePlatformOrganization() {
  const cache = useQueryClient();
  return useMutation({ mutationFn: async (input: { id: string; is_active?: boolean; domain?: string | null; subscription_plan?: string; subscription_status?: string; subscription_reference?: string }) =>
    (await apiClient.patch<Organization>(`/platform/organizations/${input.id}`, input)).data,
    onSuccess: () => cache.invalidateQueries({ queryKey: ["platform", "organizations"] }) });
}
export function usePlatformAudit() {
  return useQuery({
    queryKey: ["platform", "audit"],
    queryFn: async () => (await apiClient.get<import("../types/organization").PlatformAuditEntry[]>("/platform/audit")).data,
  });
}

