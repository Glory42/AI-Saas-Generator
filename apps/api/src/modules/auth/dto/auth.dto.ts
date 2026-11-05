import { z } from "zod";
import { CurrentPasswordSchema, EmailSchema, PasswordSchema, UsernameSchema } from "../../users/dto/user-fields.dto";

export const RegisterSchema = z.strictObject({
  email: EmailSchema,
  password: PasswordSchema,
  username: UsernameSchema,
});

export const LoginSchema = z.strictObject({
  email: EmailSchema,
  password: CurrentPasswordSchema,
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
