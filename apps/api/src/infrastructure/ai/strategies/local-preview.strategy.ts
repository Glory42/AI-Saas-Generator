import { createHash } from "node:crypto";
import sharp from "sharp";
import { AI_INPUT_MAX_DIMENSION, LOCAL_PREVIEW_COST_USD } from "../ai.constants";
import type { GenerationInput, GenerationOutput, GenerationStrategy } from "../ai.types";

type PreviewLook = {
  hue: number;
  saturation: number;
  brightness: number;
  background: { r: number; g: number; b: number };
};

// Derives a stable look from the template id so the same template always looks the same offline.
export const lookForTemplate = (templateId: string): PreviewLook => {
  const digest = createHash("sha256").update(templateId).digest();
  const byte = (index: number): number => digest[index] ?? 0;

  return {
    hue: Math.round((byte(0) / 255) * 360),
    saturation: 0.8 + (byte(1) / 255) * 0.6,
    brightness: 0.95 + (byte(2) / 255) * 0.2,
    background: { r: byte(3), g: byte(4), b: byte(5) },
  };
};

// Free, deterministic stand-in used when no AI key is configured (local dev, tests, demos).
export class LocalPreviewStrategy implements GenerationStrategy {
  readonly name = "local-preview" as const;

  async generate(input: GenerationInput): Promise<GenerationOutput> {
    const look = lookForTemplate(input.templateId);
    const padding = Math.round(AI_INPUT_MAX_DIMENSION * 0.06);

    const buffer = await sharp(input.image)
      .resize(AI_INPUT_MAX_DIMENSION, AI_INPUT_MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: look.background })
      .modulate({ hue: look.hue, saturation: look.saturation, brightness: look.brightness })
      .extend({ top: padding, bottom: padding, left: padding, right: padding, background: look.background })
      .webp({ quality: 88 })
      .toBuffer();

    return { buffer, mimeType: "image/webp", strategy: this.name, costUsd: LOCAL_PREVIEW_COST_USD };
  }
}
