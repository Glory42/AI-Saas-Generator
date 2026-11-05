import { GoogleGenAI } from "@google/genai";
import { env, resolvedAiProvider } from "../config/env";
import type { GenerationInput, GenerationOutput, GenerationStrategy, StrategyFailure } from "./ai.types";
import { runChain } from "./strategy-chain";
import { GeminiImageStrategy } from "./strategies/gemini-image.strategy";
import { HybridStrategy } from "./strategies/hybrid.strategy";
import { LocalPreviewStrategy } from "./strategies/local-preview.strategy";

const buildStrategyChain = (): GenerationStrategy[] => {
  if (resolvedAiProvider === "local" || !env.GEMINI_API_KEY) {
    return [new LocalPreviewStrategy()];
  }

  const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const chain: GenerationStrategy[] = [
    new GeminiImageStrategy(client, { flash: env.GEMINI_FLASH_IMAGE_MODEL, pro: env.GEMINI_PRO_IMAGE_MODEL }),
  ];
  if (env.HYBRID_RENDERER === "pollinations") {
    chain.push(new HybridStrategy(client, env.GEMINI_PROMPT_MODEL));
  }

  return chain;
};

const strategyChain = buildStrategyChain();

export const activeStrategies = strategyChain.map((strategy) => strategy.name);

export const runStrategyChain = (
  input: GenerationInput,
  onFailure?: (failure: StrategyFailure) => void,
): Promise<GenerationOutput> => runChain(strategyChain, input, onFailure);

export { AI_INPUT_MAX_DIMENSION } from "./ai.constants";
export { GenerationChainError, type GenerationOutput, type ModelTier } from "./ai.types";
