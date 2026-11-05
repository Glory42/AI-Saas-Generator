// Mirrors the API's rules (docs/api.md) so forms fail fast; the server stays the authority.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/;

export const validateEmail = (value: string): string | undefined =>
  EMAIL_PATTERN.test(value.trim()) ? undefined : "Enter a valid email address.";

export const validateUsername = (value: string): string | undefined =>
  USERNAME_PATTERN.test(value.trim())
    ? undefined
    : "3–32 characters: letters, numbers, dots, dashes or underscores.";

export const validatePassword = (value: string): string | undefined => {
  if (value.length < 8) return "Use at least 8 characters.";
  if (value.length > 128) return "Use at most 128 characters.";
  return undefined;
};

export const validateRequired = (value: string, label: string): string | undefined =>
  value.length > 0 ? undefined : `${label} is required.`;

export type FieldErrors<TField extends string> = Partial<Record<TField, string>>;

export const hasErrors = (errors: Record<string, string | undefined>): boolean =>
  Object.values(errors).some(Boolean);
