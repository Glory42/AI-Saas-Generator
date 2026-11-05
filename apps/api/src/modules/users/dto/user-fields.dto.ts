import { z } from "zod";

export const EmailSchema = z.email().max(254).transform((email) => email.trim().toLowerCase());

export const UsernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(32, "Username must be at most 32 characters")
  .regex(/^[a-zA-Z0-9_.-]+$/, "Username may only contain letters, numbers, '_', '.' and '-'");

export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

// Login only checks shape: the policy may have changed since the password was set.
export const CurrentPasswordSchema = z.string().min(1).max(128);
