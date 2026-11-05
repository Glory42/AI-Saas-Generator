import type { ModelTier } from "./ai.types";

// Estimated USD per image; update when provider pricing changes.
export const GEMINI_IMAGE_COST_USD: Record<ModelTier, number> = { flash: 0.039, pro: 0.134 };
export const HYBRID_COST_USD = 0.002;
export const LOCAL_PREVIEW_COST_USD = 0;

export const AI_INPUT_MAX_DIMENSION = 1024;
export const GEMINI_TIMEOUT_MS = 90_000;
export const RENDERER_TIMEOUT_MS = 60_000;
