import { z } from "zod";
import { apiRequest, type QueryRequestOptions } from "@/lib/api-client";
import {
  adminStatsSchema,
  adminUserSchema,
  auditLogSchema,
  cursorPageSchema,
  userSchema,
  type AdminStats,
  type AdminUser,
  type AuditLog,
  type CursorPage,
  type Role,
  type User,
} from "@/types/api";

const statsResponseSchema = z.object({ stats: adminStatsSchema });
const usersPageSchema = z.object({
  items: z.array(adminUserSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});
const userResponseSchema = z.object({ user: userSchema });
const auditPageSchema = cursorPageSchema(auditLogSchema);

export const ADMIN_USERS_PAGE_SIZE = 20;

export type AdminUsersQuery = { page: number; search: string };
export type AdminUsersPage = { items: AdminUser[]; page: number; pageSize: number; total: number };

export const getAdminStats = async ({ signal }: QueryRequestOptions = {}): Promise<AdminStats> => {
  const data = await apiRequest<unknown>("/api/admin/stats", { signal });
  return statsResponseSchema.parse(data).stats;
};

export const listAdminUsers = async (
  { page, search }: AdminUsersQuery,
  { signal }: QueryRequestOptions = {},
): Promise<AdminUsersPage> => {
  const params = new URLSearchParams({ page: String(page), pageSize: String(ADMIN_USERS_PAGE_SIZE) });
  if (search) params.set("search", search);
  const data = await apiRequest<unknown>(`/api/admin/users?${params.toString()}`, { signal });
  return usersPageSchema.parse(data);
};

export const updateUserRole = async (input: { userId: string; role: Role }): Promise<User> => {
  const data = await apiRequest<unknown, { role: Role }>(
    `/api/admin/users/${encodeURIComponent(input.userId)}/role`,
    { method: "PATCH", body: { role: input.role } },
  );
  return userResponseSchema.parse(data).user;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await apiRequest(`/api/admin/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
};

export const listAuditLogs = async (
  cursor: string | null,
  { signal }: QueryRequestOptions = {},
): Promise<CursorPage<AuditLog>> => {
  const params = new URLSearchParams({ limit: "25" });
  if (cursor) params.set("cursor", cursor);
  const data = await apiRequest<unknown>(`/api/admin/audit-logs?${params.toString()}`, { signal });
  return auditPageSchema.parse(data);
};
