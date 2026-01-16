import cloudinary from "../config/cloudinary";

export const StorageService = {
    async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
        const b64 = Buffer.from(file.buffer).toString("base64");
        const dataURI = "data:" + file.mimetype + ";base64," + b64;

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: folder,
        });

        return result.secure_url;
    },

    async uploadBuffer(buffer: Buffer, mimetype: string, folder: string): Promise<string> {
        const b64 = buffer.toString("base64");
        const dataURI = `data:${mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
        folder: folder,
        });

        return result.secure_url;
    }
};