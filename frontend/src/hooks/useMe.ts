import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { apiClient } from "../lib/apiClient";
import type { MyProfile, MyResume, MySalary, SkillSuggestionsResult, SkillTag } from "../types/me";

export function useMyProfile() {
  return useQuery({
    queryKey: ["me", "profile"],
    queryFn: async () => {
      const { data } = await apiClient.get<MyProfile>("/me/profile");
      return data;
    },
  });
}

export function useUpdateMySkills() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (skills: string[]) => {
      const { data } = await apiClient.put<SkillTag[]>("/me/skills", { skills });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "profile"] });
    },
  });
}

// The backend answers null (not an error) when no resume has been uploaded.
export function useMyResume() {
  return useQuery({
    queryKey: ["me", "resume"],
    queryFn: async () => {
      const { data } = await apiClient.get<MyResume | null>("/me/resume");
      return data;
    },
  });
}

export function useUploadMyResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const { data } = await apiClient.post<MyResume>("/me/resume", form);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "resume"] });
    },
  });
}

export function useDeleteMyResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete("/me/resume");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "resume"] });
    },
  });
}

// Reads the saved resume on the server and returns skills it mentions. Nothing
// is saved: the person reviews the suggestions and saves them through the
// normal skills editor.
export function useSuggestSkillsFromResume() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<SkillSuggestionsResult>("/me/resume/suggest-skills");
      return data;
    },
  });
}

// The download endpoint needs the login token, so a plain link will not
// work: fetch the file through apiClient and save it from a temporary URL.
export async function downloadMyResume(filename: string): Promise<void> {
  const response = await apiClient.get<Blob>("/me/resume/download", { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// A 404 here just means no payroll profile exists yet - that is a normal
// state for a new employee, so it resolves to null instead of an error.
export function useMySalary() {
  return useQuery({
    queryKey: ["me", "salary"],
    retry: false,
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<MySalary>("/me/salary");
        return data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });
}