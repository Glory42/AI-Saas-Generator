import { describe, expect, it } from "vitest";
import {
  adminStatsSchema,
  adminUserSchema,
  auditLogSchema,
  cursorPageSchema,
  errorBodySchema,
  generationSchema,
  imageWithGenerationsSchema,
  templateSchema,
  usageStatsSchema,
  userSchema,
} from "@/types/api";

// Samples copied from the shapes in docs/api.md, so a contract drift fails here first.
const user = {
  id: "8c4b2c1e-2f5e-4d4b-9a54-1f2b6c1e2f5e",
  email: "ada@example.com",
  username: "ada",
  role: "user",
  createdAt: "2026-11-05T10:00:00.000Z",
};

const generation = {
  id: "gen-1",
  imageId: "img-1",
  templateId: "instagram-promo",
  modelTier: "pro",
  status: "failed",
  resultUrl: null,
  costUsd: 0,
  cached: false,
  errorMessage: "Every generation strategy failed",
  createdAt: "2026-11-05T10:00:00.000Z",
  completedAt: null,
};

describe("API schemas", () => {
  it("parses a user", () => {
    expect(userSchema.parse(user)).toEqual(user);
  });

  it("rejects an unknown role", () => {
    expect(userSchema.safeParse({ ...user, role: "owner" }).success).toBe(false);
  });

  it("parses a template", () => {
    const template = { id: "ecommerce-clean", label: "E-Commerce Clean", description: "Studio white", modelTier: "flash" };
    expect(templateSchema.parse(template)).toEqual(template);
  });

  it("parses a page of images with generations", () => {
    const page = {
      items: [
        {
          id: "img-1",
          originalUrl: "/api/files/uploads/u/1.webp",
          width: 1024,
          height: 768,
          createdAt: "2026-11-05T09:00:00.000Z",
          generations: [generation],
        },
      ],
      nextCursor: null,
    };
    expect(cursorPageSchema(imageWithGenerationsSchema).parse(page)).toEqual(page);
  });

  it("rejects a generation with an unknown status", () => {
    expect(generationSchema.safeParse({ ...generation, status: "queued" }).success).toBe(false);
  });

  it("parses usage stats with an unlimited quota", () => {
    const stats = {
      totalImages: 3,
      totalGenerations: 5,
      cachedGenerations: 1,
      totalCostUsd: 0.212,
      generationsByTier: { flash: 3, pro: 2 },
      mostUsedTemplateId: "ecommerce-clean",
      quota: { limit: null, used: 5, resetsAt: "2026-11-06T10:00:00.000Z" },
    };
    expect(usageStatsSchema.parse(stats)).toEqual(stats);
  });

  it("parses admin stats, users and audit logs", () => {
    const stats = {
      totalUsers: 10,
      adminUsers: 1,
      totalImages: 40,
      totalGenerations: 90,
      cachedGenerations: 12,
      failedGenerations: 3,
      generationsLast24h: 7,
      totalCostUsd: 4.2,
    };
    expect(adminStatsSchema.parse(stats)).toEqual(stats);

    const adminUser = { ...user, imageCount: 4, generationCount: 9, totalCostUsd: 0.4 };
    expect(adminUserSchema.parse(adminUser)).toEqual(adminUser);

    const log = {
      id: "log-1",
      actorId: null,
      actorEmail: null,
      action: "auth.login_failed",
      metadata: { email: "ada@example.com" },
      ipAddress: "127.0.0.1",
      createdAt: "2026-11-05T10:00:00.000Z",
    };
    expect(auditLogSchema.parse(log)).toEqual(log);
  });

  it("parses the error envelope", () => {
    const body = { error: { message: "Validation failed", code: "VALIDATION_ERROR", details: { fieldErrors: {} } } };
    expect(errorBodySchema.parse(body)).toEqual(body);
  });
});
