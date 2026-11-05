import { toGenerationResponse } from "../../generations/helpers/generation-mapper.helper";
import type { ImageRow } from "../images.entity";
import type { ImageWithGenerationRows } from "../types/images.types";

export const toImageResponse = (row: ImageRow) => ({
  id: row.id,
  originalUrl: row.originalUrl,
  width: row.width,
  height: row.height,
  createdAt: row.createdAt.toISOString(),
});

export const toImageWithGenerationsResponse = (row: ImageWithGenerationRows) => ({
  ...toImageResponse(row),
  generations: row.generations.map(toGenerationResponse),
});
