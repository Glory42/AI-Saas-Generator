import type { Generation, ImageWithGenerations } from "@/types/api";

// Generations arrive newest first, so the first completed one is the latest result.
export const latestCompletedGeneration = (image: ImageWithGenerations): Generation | undefined =>
  image.generations.find((generation) => generation.status === "completed" && generation.resultUrl);

export const thumbnailUrl = (image: ImageWithGenerations): string =>
  latestCompletedGeneration(image)?.resultUrl ?? image.originalUrl;
