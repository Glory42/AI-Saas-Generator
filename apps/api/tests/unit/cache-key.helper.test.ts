import { describe, expect, test } from "bun:test";
import { buildCacheKey, type CacheKeyInput } from "../../src/modules/generations/helpers/cache-key.helper";

const base: CacheKeyInput = { contentHash: "abc", templateId: "ecommerce-clean", promptVersion: 1, modelTier: "flash" };

describe("buildCacheKey", () => {
  test("is deterministic", () => {
    expect(buildCacheKey(base)).toBe(buildCacheKey({ ...base }));
    expect(buildCacheKey(base)).toMatch(/^[0-9a-f]{64}$/);
  });

  test.each<[string, Partial<CacheKeyInput>]>([
    ["content", { contentHash: "abd" }],
    ["template", { templateId: "luxury-dark" }],
    ["prompt version", { promptVersion: 2 }],
    ["model tier", { modelTier: "pro" }],
  ])("changes when the %s changes", (_label, change) => {
    expect(buildCacheKey({ ...base, ...change })).not.toBe(buildCacheKey(base));
  });
});
