import { z } from "zod";
import { ValidationError } from "../errors/app-error";

export const parseInput = <TSchema extends z.ZodType>(schema: TSchema, value: unknown): z.output<TSchema> => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ValidationError(z.flattenError(result.error));
  }

  return result.data;
};
