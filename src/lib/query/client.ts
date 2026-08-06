import { QueryClient } from "@tanstack/react-query";

/**
 * App-wide TanStack Query client. Created once per mount in <Providers/>
 * (lazy useState initializer keeps it stable across re-renders).
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
