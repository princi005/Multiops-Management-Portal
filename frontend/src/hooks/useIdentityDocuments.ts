import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { getActiveOrganizationId } from "../lib/activeOrganization";
import type { IdentityDocument, IdentityDocumentType } from "../types/identityDocument";

export function useEmployeeIdentityDocuments(employeeId: string) {
  const organizationId = getActiveOrganizationId();
  return useQuery({
    queryKey: ["hr-identity-documents", organizationId, employeeId],
    queryFn: async () => {
      const { data } = await apiClient.get<IdentityDocument[]>(`/identity-documents/${employeeId}`);
      return data;
    },
    enabled: Boolean(employeeId),
  });
}

export function useVerifyIdentityDocument(employeeId: string) {
  const organizationId = getActiveOrganizationId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentType: IdentityDocumentType) => {
      const { data } = await apiClient.post<IdentityDocument>(
        `/identity-documents/${employeeId}/${documentType}/verify`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-identity-documents", organizationId, employeeId] });
    },
  });
}

export async function downloadEmployeeIdentityDocument(
  employeeId: string,
  documentType: IdentityDocumentType,
  filename: string,
) {
  const { data } = await apiClient.get<Blob>(
    `/identity-documents/${employeeId}/${documentType}/download`,
    { responseType: "blob" },
  );
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}