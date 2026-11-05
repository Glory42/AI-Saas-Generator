import { describe, expect, test } from "bun:test";
import sharp from "sharp";
import { AppError } from "../../src/commons/errors/app-error";
import { normalizeUpload } from "../../src/modules/images/helpers/normalize-upload.helper";

const solid = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: { r: 200, g: 40, b: 90 } } });

const codeOf = async (promise: Promise<unknown>): Promise<string | null> => {
  try {
    await promise;
    return null;
  } catch (error) {
    return error instanceof AppError ? error.code : "UNEXPECTED";
  }
};

describe("normalizeUpload", () => {
  test("re-encodes PNG as WebP and hashes the result", async () => {
    const result = await normalizeUpload(await solid(64, 32).png().toBuffer());

    expect(result.mimeType).toBe("image/webp");
    expect((await sharp(result.buffer).metadata()).format).toBe("webp");
    expect({ width: result.width, height: result.height }).toEqual({ width: 64, height: 32 });
    expect(result.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  test("identical bytes produce identical hashes", async () => {
    const input = await solid(16, 16).jpeg().toBuffer();
    expect((await normalizeUpload(input)).contentHash).toBe((await normalizeUpload(input)).contentHash);
  });

  test("applies EXIF orientation and strips metadata", async () => {
    const rotated = await solid(40, 20).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    const result = await normalizeUpload(rotated);

    expect({ width: result.width, height: result.height }).toEqual({ width: 20, height: 40 });
    expect((await sharp(result.buffer).metadata()).orientation).toBeUndefined();
  });

  test("rejects non-images regardless of what they claim to be", async () => {
    expect(await codeOf(normalizeUpload(Buffer.from("definitely not a png")))).toBe("UNSUPPORTED_MEDIA");
  });

  test("rejects image formats outside the allow-list", async () => {
    expect(await codeOf(normalizeUpload(await solid(8, 8).gif().toBuffer()))).toBe("UNSUPPORTED_MEDIA");
  });

  test("rejects images wider than 8000px", async () => {
    expect(await codeOf(normalizeUpload(await solid(8001, 1).png().toBuffer()))).toBe("BAD_REQUEST");
  });
});
