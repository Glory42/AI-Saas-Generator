import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api-client";
import { toast } from "./toast";

const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 408, 409, 413, 415, 429]);

const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (error instanceof ApiError && NON_RETRYABLE_STATUSES.has(error.status)) return false;
  return failureCount < 1;
};

const SESSION_QUERY_KEY = ["auth", "session"] as const;

// A 401 anywhere means the session is gone; drop the cached user so guards redirect.
const handleUnauthorized = (error: unknown, queryKey?: readonly unknown[]): void => {
  if (!(error instanceof ApiError) || error.status !== 401) return;
  if (queryKey && queryKey[0] === SESSION_QUERY_KEY[0]) return;
  queryClient.setQueryData(SESSION_QUERY_KEY, null);
};

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => handleUnauthorized(error, query.queryKey),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      handleUnauthorized(error);
      // Mutations that render their own error inline opt out via meta.
      if (mutation.meta?.silent) return;
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: { silent?: boolean };
  }
}
