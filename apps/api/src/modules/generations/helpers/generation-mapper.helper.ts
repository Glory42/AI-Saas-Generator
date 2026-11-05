import type { GenerationRow } from "../generations.entity";

export const toGenerationResponse = (row: GenerationRow) => ({
  id: row.id,
  imageId: row.imageId,
  templateId: row.templateId,
  modelTier: row.modelTier,
  status: row.status,
  resultUrl: row.resultUrl,
  costUsd: Number(row.costUsd),
  cached: row.cached,
  errorMessage: row.errorMessage,
  createdAt: row.createdAt.toISOString(),
  completedAt: row.completedAt?.toISOString() ?? null,
});

export type GenerationResponse = ReturnType<typeof toGenerationResponse>;
