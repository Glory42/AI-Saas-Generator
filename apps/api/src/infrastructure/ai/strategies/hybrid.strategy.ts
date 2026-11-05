import type { GoogleGenAI } from "@google/genai";
import { GEMINI_TIMEOUT_MS, HYBRID_COST_USD, RENDERER_TIMEOUT_MS } from "../ai.constants";
import type { GenerationInput, GenerationOutput, GenerationStrategy } from "../ai.types";

const ART_DIRECTOR_PROMPT = (request: string): string =>
  [
    "You are an art director for e-commerce product photography.",
    `Creative brief: ${request}`,
    "Study the attached product photo and write ONE detailed text-to-image prompt that recreates this exact product in that style.",
    "Describe the product, materials, lighting, camera angle and background. Reply with the prompt only.",
  ].join("\n");

const MAX_RENDER_PROMPT_LENGTH = 1500;

// Gemini describes the shot, an external text-to-image renderer draws it.
export class HybridStrategy implements GenerationStrategy {
  readonly name = "hybrid" as const;

  constructor(
    private readonly client: GoogleGenAI,
    private readonly promptModel: string,
  ) {}

  async generate(input: GenerationInput): Promise<GenerationOutput> {
    const response = await this.client.models.generateContent({
      model: this.promptModel,
      contents: [
        {
          role: "user",
          parts: [
            { text: ART_DIRECTOR_PROMPT(input.prompt) },
            { inlineData: { mimeType: input.mimeType, data: input.image.toString("base64") } },
          ],
        },
      ],
      config: { abortSignal: AbortSignal.timeout(GEMINI_TIMEOUT_MS) },
    });

    const renderPrompt = response.text?.replace(/^(here is (a|the) prompt:|prompt:)/i, "").trim();
    if (!renderPrompt) throw new Error("Prompt model returned no text");

    const seed = Math.floor(Math.random() * 1_000_000);
    const url = new URL(
      `https://image.pollinations.ai/prompt/${encodeURIComponent(renderPrompt.slice(0, MAX_RENDER_PROMPT_LENGTH))}`,
    );
    url.search = new URLSearchParams({
      width: "1024",
      height: "1024",
      seed: String(seed),
      model: "flux",
      nologo: "true",
    }).toString();

    const render = await fetch(url, { signal: AbortSignal.timeout(RENDERER_TIMEOUT_MS) });
    const contentType = render.headers.get("content-type") ?? "";
    if (!render.ok || !contentType.startsWith("image/")) {
      throw new Error(`Renderer responded ${render.status} (${contentType || "no content type"})`);
    }

    return {
      buffer: Buffer.from(await render.arrayBuffer()),
      mimeType: contentType.split(";")[0] ?? "image/jpeg",
      strategy: this.name,
      costUsd: HYBRID_COST_USD,
    };
  }
}
