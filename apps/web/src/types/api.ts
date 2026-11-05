import { z } from "zod";

// Mirrors docs/api.md; every response is parsed with these before reaching a component.

export const roleSchema = z.enum(["user", "admin"]);
export const modelTierSchema = z.enum(["flash", "pro"]);
export const generationStatusSchema = z.enum(["pending", "completed", "failed"]);

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
  role: roleSchema,
  createdAt: z.string(),
});

export const templateSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  modelTier: modelTierSchema,
});

export const imageSchema = z.object({
  id: z.string(),
  originalUrl: z.string(),
  width: z.number(),
  height: z.number(),
  createdAt: z.string(),
});

export const generationSchema = z.object({
  id: z.string(),
  imageId: z.string(),
  templateId: z.string(),
  modelTier: modelTierSchema,
  status: generationStatusSchema,
  resultUrl: z.string().nullable(),
  costUsd: z.number(),
  cached: z.boolean(),
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
});

export const imageWithGenerationsSchema = imageSchema.extend({
  generations: z.array(generationSchema),
});

export const usageStatsSchema = z.object({
  totalImages: z.number(),
  totalGenerations: z.number(),
  cachedGenerations: z.number(),
  totalCostUsd: z.number(),
  generationsByTier: z.object({ flash: z.number(), pro: z.number() }),
  mostUsedTemplateId: z.string().nullable(),
  quota: z.object({
    limit: z.number().nullable(),
    used: z.number(),
    resetsAt: z.string(),
  }),
});

export const adminStatsSchema = z.object({
  totalUsers: z.number(),
  adminUsers: z.number(),
  totalImages: z.number(),
  totalGenerations: z.number(),
  cachedGenerations: z.number(),
  failedGenerations: z.number(),
  generationsLast24h: z.number(),
  totalCostUsd: z.number(),
});

export const adminUserSchema = userSchema.extend({
  imageCount: z.number(),
  generationCount: z.number(),
  totalCostUsd: z.number(),
});

export const auditLogSchema = z.object({
  id: z.string(),
  actorId: z.string().nullable(),
  actorEmail: z.string().nullable(),
  action: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  ipAddress: z.string().nullable(),
  createdAt: z.string(),
});

export const cursorPageSchema = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), nextCursor: z.string().nullable() });

export const errorBodySchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string(),
    details: z.unknown().optional(),
  }),
});

export type Role = z.infer<typeof roleSchema>;
export type ModelTier = z.infer<typeof modelTierSchema>;
export type GenerationStatus = z.infer<typeof generationStatusSchema>;
export type User = z.infer<typeof userSchema>;
export type Template = z.infer<typeof templateSchema>;
export type Image = z.infer<typeof imageSchema>;
export type Generation = z.infer<typeof generationSchema>;
export type ImageWithGenerations = z.infer<typeof imageWithGenerationsSchema>;
export type UsageStats = z.infer<typeof usageStatsSchema>;
export type AdminStats = z.infer<typeof adminStatsSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type AuditLog = z.infer<typeof auditLogSchema>;
export type CursorPage<T> = { items: T[]; nextCursor: string | null };
