import { z } from "zod";
import { apiRequest, type QueryRequestOptions } from "@/lib/api-client";
import { usageStatsSchema, userSchema, type UsageStats, type User } from "@/types/api";

const userResponseSchema = z.object({ user: userSchema });
const statsResponseSchema = z.object({ stats: usageStatsSchema });

export type ProfileUpdate = { username?: string; email?: string };
export type PasswordChange = { currentPassword: string; newPassword: string };

export const updateProfile = async (input: ProfileUpdate): Promise<User> => {
  const data = await apiRequest<unknown, ProfileUpdate>("/api/users/me", {
    method: "PATCH",
    body: input,
  });
  return userResponseSchema.parse(data).user;
};

export const changePassword = async (input: PasswordChange): Promise<void> => {
  await apiRequest<unknown, PasswordChange>("/api/users/me/password", {
    method: "POST",
    body: input,
  });
};

export const deleteAccount = async (currentPassword: string): Promise<void> => {
  await apiRequest<unknown, { currentPassword: string }>("/api/users/me", {
    method: "DELETE",
    body: { currentPassword },
  });
};

export const getUsageStats = async ({ signal }: QueryRequestOptions = {}): Promise<UsageStats> => {
  const data = await apiRequest<unknown>("/api/users/me/stats", { signal });
  return statsResponseSchema.parse(data).stats;
};
