import { z } from "zod";
import { TemplateIdSchema } from "../../templates/dto/templates.dto";

export const CreateGenerationSchema = z.strictObject({ templateId: TemplateIdSchema });

export type CreateGenerationInput = z.infer<typeof CreateGenerationSchema>;
