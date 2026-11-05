import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import * as authApi from "../api";
import type { User } from "@/types/api";

export const authKeys = {
  session: ["auth", "session"] as const,
};

export const authQueryOptions = queryOptions({
  queryKey: authKeys.session,
  queryFn: ({ signal }) => authApi.getSession({ signal }),
  staleTime: 5 * 60_000,
});

export const useAuth = () => {
  const { data, isPending } = useQuery(authQueryOptions);
  const user: User | null = data ?? null;
  return { user, isPending, isAdmin: user?.role === "admin" };
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    meta: { silent: true },
    onSuccess: (user) => queryClient.setQueryData(authKeys.session, user),
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.register,
    meta: { silent: true },
    onSuccess: (user) => queryClient.setQueryData(authKeys.session, user),
  });
};

// Signing out wipes every cached query so the next user never sees the previous one's data.
const useSignOutMutation = (mutationFn: () => Promise<void>) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn,
    onSettled: async () => {
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "auth" });
      queryClient.setQueryData(authKeys.session, null);
      await navigate({ to: "/" });
    },
  });
};

export const useLogout = () => useSignOutMutation(authApi.logout);

export const useLogoutAll = () => useSignOutMutation(authApi.logoutAll);
