import { z } from "zod";
import { apiRequest, type QueryRequestOptions } from "@/lib/api-client";
import {
  cursorPageSchema,
  generationSchema,
  imageSchema,
  imageWithGenerationsSchema,
  type CursorPage,
  type Generation,
  type Image,
  type ImageWithGenerations,
} from "@/types/api";

const imageResponseSchema = z.object({ image: imageSchema });
const imageDetailResponseSchema = z.object({ image: imageWithGenerationsSchema });
const imagesPageSchema = cursorPageSchema(imageWithGenerationsSchema);
const generationResponseSchema = z.object({ generation: generationSchema, cached: z.boolean() });

export const IMAGES_PAGE_SIZE = 24;

export type GenerationResult = { generation: Generation; cached: boolean };

export const listImages = async (
  cursor: string | null,
  { signal }: QueryRequestOptions = {},
): Promise<CursorPage<ImageWithGenerations>> => {
  const params = new URLSearchParams({ limit: String(IMAGES_PAGE_SIZE) });
  if (cursor) params.set("cursor", cursor);
  const data = await apiRequest<unknown>(`/api/images?${params.toString()}`, { signal });
  return imagesPageSchema.parse(data);
};

export const getImage = async (
  imageId: string,
  { signal }: QueryRequestOptions = {},
): Promise<ImageWithGenerations> => {
  const data = await apiRequest<unknown>(`/api/images/${encodeURIComponent(imageId)}`, { signal });
  return imageDetailResponseSchema.parse(data).image;
};

export const uploadImage = async (file: File): Promise<Image> => {
  const form = new FormData();
  form.append("image", file);
  const data = await apiRequest<unknown, FormData>("/api/images", {
    method: "POST",
    body: form,
    timeoutMs: 60_000,
  });
  return imageResponseSchema.parse(data).image;
};

export const deleteImage = async (imageId: string): Promise<void> => {
  await apiRequest(`/api/images/${encodeURIComponent(imageId)}`, { method: "DELETE" });
};

// Image models can take well over a minute on the pro tier.
export const createGeneration = async (input: {
  imageId: string;
  templateId: string;
}): Promise<GenerationResult> => {
  const data = await apiRequest<unknown, { templateId: string }>(
    `/api/images/${encodeURIComponent(input.imageId)}/generations`,
    { method: "POST", body: { templateId: input.templateId }, timeoutMs: 180_000 },
  );
  return generationResponseSchema.parse(data);
};
