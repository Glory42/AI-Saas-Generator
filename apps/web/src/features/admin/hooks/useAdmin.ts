import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as adminApi from "../api";

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  usersPage: (query: adminApi.AdminUsersQuery) => [...adminKeys.users(), query] as const,
  auditLogs: () => [...adminKeys.all, "audit-logs"] as const,
};

export const adminStatsQueryOptions = queryOptions({
  queryKey: adminKeys.stats(),
  queryFn: ({ signal }) => adminApi.getAdminStats({ signal }),
});

export const adminUsersQueryOptions = (query: adminApi.AdminUsersQuery) =>
  queryOptions({
    queryKey: adminKeys.usersPage(query),
    queryFn: ({ signal }) => adminApi.listAdminUsers(query, { signal }),
    placeholderData: keepPreviousData,
  });

export const auditLogsInfiniteQueryOptions = infiniteQueryOptions({
  queryKey: adminKeys.auditLogs(),
  queryFn: ({ pageParam, signal }) => adminApi.listAuditLogs(pageParam, { signal }),
  initialPageParam: null as string | null,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

export const useAdminStats = () => useQuery(adminStatsQueryOptions);

export const useAdminUsers = (query: adminApi.AdminUsersQuery) => useQuery(adminUsersQueryOptions(query));

export const useAuditLogs = () => useInfiniteQuery(auditLogsInfiniteQueryOptions);

// Role changes and deletions are audited, so the audit log is stale after either.
const useAdminUserMutation = <TInput, TOutput>(mutationFn: (input: TInput) => Promise<TOutput>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.users() }),
        queryClient.invalidateQueries({ queryKey: adminKeys.stats() }),
        queryClient.invalidateQueries({ queryKey: adminKeys.auditLogs() }),
      ]),
  });
};

export const useUpdateUserRole = () => useAdminUserMutation(adminApi.updateUserRole);

export const useDeleteUser = () => useAdminUserMutation(adminApi.deleteUser);
