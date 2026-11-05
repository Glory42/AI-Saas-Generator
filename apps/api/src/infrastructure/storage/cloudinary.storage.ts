import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { StorageObjectNotFoundError, type StorageProvider, type StoredObject } from "./storage.types";

type CloudinaryCredentials = { cloudName: string; apiKey: string; apiSecret: string };

const ROOT_FOLDER = "ai-saas-generator";

// Cloudinary public ids carry no extension; the format is tracked by Cloudinary itself.
const toPublicId = (key: string): string => `${ROOT_FOLDER}/${key.replace(/\.[a-z]+$/, "")}`;

export class CloudinaryStorage implements StorageProvider {
  readonly name = "cloudinary" as const;

  constructor(credentials: CloudinaryCredentials) {
    cloudinary.config({
      cloud_name: credentials.cloudName,
      api_key: credentials.apiKey,
      api_secret: credentials.apiSecret,
      secure: true,
    });
  }

  async put(key: string, body: Buffer): Promise<StoredObject> {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { public_id: toPublicId(key), resource_type: "image", overwrite: false },
        (error, response) => {
          if (error || !response) {
            reject(new Error(error?.message ?? "Cloudinary upload returned no response"));
            return;
          }
          resolve(response);
        },
      );
      stream.end(body);
    });

    return { key, url: result.secure_url };
  }

  async read(key: string): Promise<Buffer> {
    const url = cloudinary.url(toPublicId(key), { resource_type: "image", secure: true });
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (response.status === 404) throw new StorageObjectNotFoundError(key);
    if (!response.ok) throw new Error(`Cloudinary read failed with ${response.status}`);

    return Buffer.from(await response.arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    await cloudinary.uploader.destroy(toPublicId(key), { resource_type: "image", invalidate: true });
  }
}
