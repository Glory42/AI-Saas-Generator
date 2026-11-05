import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import * as settingsApi from "../api";
import { authKeys } from "@/features/auth/hooks/useAuth";

export const settingsKeys = {
  all: ["account"] as const,
  stats: () => [...settingsKeys.all, "stats"] as const,
};

export const usageStatsQueryOptions = queryOptions({
  queryKey: settingsKeys.stats(),
  queryFn: ({ signal }) => settingsApi.getUsageStats({ signal }),
});

export const useUsageStats = () => useQuery(usageStatsQueryOptions);

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.updateProfile,
    meta: { silent: true },
    onSuccess: (user) => queryClient.setQueryData(authKeys.session, user),
  });
};

export const useChangePassword = () =>
  useMutation({ mutationFn: settingsApi.changePassword, meta: { silent: true } });

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: settingsApi.deleteAccount,
    meta: { silent: true },
    onSuccess: async () => {
      queryClient.clear();
      queryClient.setQueryData(authKeys.session, null);
      await navigate({ to: "/" });
    },
  });
};
