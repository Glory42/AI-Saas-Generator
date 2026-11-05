import { z } from "zod";
import { CurrentPasswordSchema, EmailSchema, PasswordSchema, UsernameSchema } from "./user-fields.dto";

export const UpdateProfileSchema = z
  .strictObject({
    username: UsernameSchema.optional(),
    email: EmailSchema.optional(),
  })
  .refine((value) => value.username !== undefined || value.email !== undefined, {
    message: "Provide at least one of username or email",
  });

export const ChangePasswordSchema = z.strictObject({
  currentPassword: CurrentPasswordSchema,
  newPassword: PasswordSchema,
});

export const DeleteAccountSchema = z.strictObject({
  currentPassword: CurrentPasswordSchema,
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
