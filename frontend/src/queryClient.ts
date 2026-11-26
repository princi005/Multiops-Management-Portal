import { QueryClient } from "@tanstack/react-query";
import { getActiveOrganizationId } from "./lib/activeOrganization";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
      queryKeyHashFn: (queryKey) =>
        JSON.stringify([getActiveOrganizationId(), queryKey]),
    },
  },
});
