export type ModelTier = "flash" | "pro";

export type StrategyName = "gemini-image" | "hybrid" | "local-preview";

export type GenerationInput = {
  image: Buffer;
  mimeType: string;
  prompt: string;
  templateId: string;
  modelTier: ModelTier;
};

export type GenerationOutput = {
  buffer: Buffer;
  mimeType: string;
  strategy: StrategyName;
  costUsd: number;
};

export interface GenerationStrategy {
  readonly name: StrategyName;
  generate(input: GenerationInput): Promise<GenerationOutput>;
}

export type StrategyFailure = { strategy: StrategyName; message: string };

export class GenerationChainError extends Error {
  constructor(readonly failures: StrategyFailure[]) {
    super(`All generation strategies failed: ${failures.map((f) => `${f.strategy}: ${f.message}`).join("; ")}`);
    this.name = "GenerationChainError";
  }
}
