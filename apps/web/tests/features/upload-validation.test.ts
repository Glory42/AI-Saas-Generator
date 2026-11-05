import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, validateUploadFile } from "@/features/images/upload-validation";

describe("validateUploadFile", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("accepts %s", (type) => {
    expect(validateUploadFile({ type, size: 1024 })).toEqual({ ok: true });
  });

  it.each(["image/gif", "image/svg+xml", "application/pdf", ""])("rejects %s", (type) => {
    expect(validateUploadFile({ type, size: 1024 })).toMatchObject({ ok: false });
  });

  it("rejects files over 10 MB", () => {
    expect(validateUploadFile({ type: "image/png", size: MAX_UPLOAD_BYTES + 1 })).toEqual({
      ok: false,
      message: "Images must be 10 MB or smaller.",
    });
  });

  it("accepts a file exactly at the limit", () => {
    expect(validateUploadFile({ type: "image/png", size: MAX_UPLOAD_BYTES })).toEqual({ ok: true });
  });

  it("rejects empty files", () => {
    expect(validateUploadFile({ type: "image/png", size: 0 })).toMatchObject({ ok: false });
  });
});
