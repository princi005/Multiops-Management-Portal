import axios from "axios";
import { supabase } from "./supabaseClient";
import { getActiveOrganizationId } from "./activeOrganization";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const organizationId = getActiveOrganizationId();

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (organizationId) config.headers["X-Organization-Id"] = organizationId;

  return config;
});
