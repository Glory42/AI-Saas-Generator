export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type UploadValidationResult = { ok: true } | { ok: false; message: string };

// Mirrors the API's limits so users get instant feedback; the server still sniffs the real bytes.
export const validateUploadFile = (file: Pick<File, "type" | "size">): UploadValidationResult => {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, message: "Only JPEG, PNG and WebP images are supported." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: "Images must be 10 MB or smaller." };
  }
  if (file.size === 0) {
    return { ok: false, message: "That file is empty." };
  }
  return { ok: true };
};
