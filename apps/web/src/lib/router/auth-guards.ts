import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { authQueryOptions } from "@/features/auth/hooks/useAuth";
import type { User } from "@/types/api";
import { getSafeRedirectPath } from "./redirect";

type AuthGuardInput = {
  queryClient: QueryClient;
  redirectPath?: string;
};

const loadSessionUser = async (queryClient: QueryClient): Promise<User | null> => {
  try {
    return await queryClient.ensureQueryData(authQueryOptions);
  } catch {
    return null;
  }
};

export const requireAuthenticatedUser = async ({
  queryClient,
  redirectPath,
}: AuthGuardInput): Promise<User> => {
  const user = await loadSessionUser(queryClient);
  if (!user) {
    throw redirect({
      to: "/login",
      search: { redirect: getSafeRedirectPath(redirectPath, "/studio") },
    });
  }
  return user;
};

export const requireGuestUser = async (queryClient: QueryClient): Promise<void> => {
  const user = await loadSessionUser(queryClient);
  if (user) throw redirect({ to: "/studio" });
};

export const requireAdminUser = async (input: AuthGuardInput): Promise<User> => {
  const user = await requireAuthenticatedUser(input);
  if (user.role !== "admin") throw redirect({ to: "/studio" });
  return user;
};
