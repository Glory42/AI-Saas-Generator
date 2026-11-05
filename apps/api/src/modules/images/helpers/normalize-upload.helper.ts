import { createHash } from "node:crypto";
import sharp from "sharp";
import { BadRequestError, UnsupportedMediaError } from "../../../commons/errors/app-error";
import {
  ACCEPTED_UPLOAD_FORMATS,
  MAX_UPLOAD_DIMENSION,
  UPLOAD_WEBP_QUALITY,
} from "../constants/images.constants";

export type NormalizedUpload = {
  buffer: Buffer;
  mimeType: "image/webp";
  width: number;
  height: number;
  sizeBytes: number;
  contentHash: string;
};

const readFormat = async (input: Buffer): Promise<{ format: string; width: number; height: number }> => {
  try {
    const metadata = await sharp(input).metadata();
    return { format: metadata.format, width: metadata.width, height: metadata.height };
  } catch {
    throw new UnsupportedMediaError();
  }
};

// Trusts the bytes, not the filename or Content-Type, then strips EXIF (GPS included) by re-encoding.
export const normalizeUpload = async (input: Buffer): Promise<NormalizedUpload> => {
  const { format, width, height } = await readFormat(input);
  if (!ACCEPTED_UPLOAD_FORMATS.has(format)) throw new UnsupportedMediaError();
  if (width > MAX_UPLOAD_DIMENSION || height > MAX_UPLOAD_DIMENSION) {
    throw new BadRequestError(`Images must be at most ${MAX_UPLOAD_DIMENSION}px on each side`);
  }

  const { data, info } = await sharp(input)
    .rotate()
    .webp({ quality: UPLOAD_WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    mimeType: "image/webp",
    width: info.width,
    height: info.height,
    sizeBytes: info.size,
    contentHash: createHash("sha256").update(data).digest("hex"),
  };
};
