import sharp from "sharp";

export const pngFile = async (color = { r: 30, g: 120, b: 220 }, size = 64): Promise<Blob> => {
  const buffer = await sharp({ create: { width: size, height: size, channels: 3, background: color } }).png().toBuffer();
  return new Blob([new Uint8Array(buffer)], { type: "image/png" });
};

export const imageForm = (file: Blob, filename = "product.png"): FormData => {
  const form = new FormData();
  form.append("image", file, filename);
  return form;
};
