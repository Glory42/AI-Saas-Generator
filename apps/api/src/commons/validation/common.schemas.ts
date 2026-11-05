import { z } from "zod";

export const IdParamsSchema = z.object({ id: z.uuid() });

export const CursorQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(200).optional(),
});

export type CursorQuery = z.infer<typeof CursorQuerySchema>;
