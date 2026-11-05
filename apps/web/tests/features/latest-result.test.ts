import { describe, expect, it } from "vitest";
import { latestCompletedGeneration, thumbnailUrl } from "@/features/gallery/latest-result";
import type { Generation, ImageWithGenerations } from "@/types/api";

const generation = (overrides: Partial<Generation>): Generation => ({
  id: "g",
  imageId: "img",
  templateId: "ecommerce-clean",
  modelTier: "flash",
  status: "completed",
  resultUrl: "https://cdn.example/result.png",
  costUsd: 0.039,
  cached: false,
  errorMessage: null,
  createdAt: "2026-11-05T10:00:00.000Z",
  completedAt: "2026-11-05T10:00:05.000Z",
  ...overrides,
});

const image = (generations: Generation[]): ImageWithGenerations => ({
  id: "img",
  originalUrl: "https://cdn.example/original.webp",
  width: 800,
  height: 600,
  createdAt: "2026-11-05T09:00:00.000Z",
  generations,
});

describe("latest result helpers", () => {
  it("skips failed attempts and picks the newest completed generation", () => {
    const failed = generation({ id: "failed", status: "failed", resultUrl: null });
    const completed = generation({ id: "done", resultUrl: "https://cdn.example/done.png" });

    expect(latestCompletedGeneration(image([failed, completed]))?.id).toBe("done");
    expect(thumbnailUrl(image([failed, completed]))).toBe("https://cdn.example/done.png");
  });

  it("falls back to the original when nothing completed", () => {
    expect(thumbnailUrl(image([generation({ status: "pending", resultUrl: null })]))).toBe(
      "https://cdn.example/original.webp",
    );
  });
});
