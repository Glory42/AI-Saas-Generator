import { z } from "zod";

export const AdminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
});

export const UpdateRoleSchema = z.strictObject({ role: z.enum(["user", "admin"]) });

export type AdminUsersQuery = z.infer<typeof AdminUsersQuerySchema>;
