import type { GoogleGenAI } from "@google/genai";
import { GEMINI_IMAGE_COST_USD, GEMINI_TIMEOUT_MS } from "../ai.constants";
import type { GenerationInput, GenerationOutput, GenerationStrategy, ModelTier } from "../ai.types";

export class GeminiImageStrategy implements GenerationStrategy {
  readonly name = "gemini-image" as const;

  constructor(
    private readonly client: GoogleGenAI,
    private readonly models: Record<ModelTier, string>,
  ) {}

  async generate(input: GenerationInput): Promise<GenerationOutput> {
    const response = await this.client.models.generateContent({
      model: this.models[input.modelTier],
      contents: [
        {
          role: "user",
          parts: [
            { text: input.prompt },
            { inlineData: { mimeType: input.mimeType, data: input.image.toString("base64") } },
          ],
        },
      ],
      config: { responseModalities: ["IMAGE"], abortSignal: AbortSignal.timeout(GEMINI_TIMEOUT_MS) },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data);
    const data = imagePart?.inlineData?.data;
    if (!data) {
      throw new Error(`Model returned no image (finish reason: ${response.candidates?.[0]?.finishReason ?? "unknown"})`);
    }

    return {
      buffer: Buffer.from(data, "base64"),
      mimeType: imagePart.inlineData?.mimeType ?? "image/png",
      strategy: this.name,
      costUsd: GEMINI_IMAGE_COST_USD[input.modelTier],
    };
  }
}
