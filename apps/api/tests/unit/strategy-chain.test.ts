import { describe, expect, test } from "bun:test";
import sharp from "sharp";
import {
  GenerationChainError,
  type GenerationInput,
  type GenerationStrategy,
  type StrategyName,
} from "../../src/infrastructure/ai/ai.types";
import { LocalPreviewStrategy, lookForTemplate } from "../../src/infrastructure/ai/strategies/local-preview.strategy";
import { runChain } from "../../src/infrastructure/ai/strategy-chain";

const input = async (templateId = "ecommerce-clean"): Promise<GenerationInput> => ({
  image: await sharp({ create: { width: 32, height: 32, channels: 3, background: "white" } }).jpeg().toBuffer(),
  mimeType: "image/jpeg",
  prompt: "test",
  templateId,
  modelTier: "flash",
});

const failing = (name: StrategyName): GenerationStrategy => ({
  name,
  generate: () => Promise.reject(new Error(`${name} is down`)),
});

describe("runChain", () => {
  test("falls through failures to the first strategy that succeeds", async () => {
    const seen: string[] = [];
    const output = await runChain([failing("gemini-image"), new LocalPreviewStrategy()], await input(), (failure) =>
      seen.push(failure.strategy),
    );

    expect(output.strategy).toBe("local-preview");
    expect(seen).toEqual(["gemini-image"]);
  });

  test("throws with every failure when nothing succeeds", async () => {
    const run = runChain([failing("gemini-image"), failing("hybrid")], await input());
    await expect(run).rejects.toBeInstanceOf(GenerationChainError);
    await expect(run).rejects.toMatchObject({ failures: [{ strategy: "gemini-image" }, { strategy: "hybrid" }] });
  });
});

describe("LocalPreviewStrategy", () => {
  test("returns a free WebP image", async () => {
    const output = await new LocalPreviewStrategy().generate(await input());
    expect(output).toMatchObject({ mimeType: "image/webp", strategy: "local-preview", costUsd: 0 });
    expect((await sharp(output.buffer).metadata()).format).toBe("webp");
  });

  test("looks are stable per template and differ between templates", () => {
    expect(lookForTemplate("luxury-dark")).toEqual(lookForTemplate("luxury-dark"));
    expect(lookForTemplate("luxury-dark")).not.toEqual(lookForTemplate("ecommerce-clean"));
  });
});
