import cloudinary from "../config/cloudinary";

export const StorageService = {
  async uploadFile(file: Express.Multer.File): Promise<string> {
    const b64 = Buffer.from(file.buffer).toString("base64");
    const dataURI = "data:" + file.mimetype + ";base64," + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "ai-saas-app",
    });

    return result.secure_url;
  }
};