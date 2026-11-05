import { z } from "zod";
import { apiRequest, type QueryRequestOptions } from "@/lib/api-client";
import { templateSchema, type Template } from "@/types/api";

const templatesResponseSchema = z.object({ templates: z.array(templateSchema) });

export const listTemplates = async ({ signal }: QueryRequestOptions = {}): Promise<Template[]> => {
  const data = await apiRequest<unknown>("/api/templates", { signal });
  return templatesResponseSchema.parse(data).templates;
};
