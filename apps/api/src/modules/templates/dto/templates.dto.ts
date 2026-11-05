import { z } from "zod";

export const TemplateIdSchema = z.string().trim().min(1).max(64).regex(/^[a-z0-9-]+$/, "Invalid template id");

export const TemplateParamsSchema = z.object({ id: TemplateIdSchema });
