import { createHash } from "node:crypto";
import type { ModelTier } from "../../../infrastructure/ai";

export type CacheKeyInput = {
  contentHash: string;
  templateId: string;
  promptVersion: number;
  modelTier: ModelTier;
};

// Every input that changes the rendered result is part of the key (ADR 0003).
export const buildCacheKey = (input: CacheKeyInput): string =>
  createHash("sha256")
    .update([input.contentHash, input.templateId, `v${input.promptVersion}`, input.modelTier].join(":"))
    .digest("hex");
