import { env, resolvedStorageProvider } from "../config/env";
import { CloudinaryStorage } from "./cloudinary.storage";
import { LocalDiskStorage } from "./local-disk.storage";
import type { StorageProvider } from "./storage.types";

const createStorage = (): StorageProvider => {
  if (
    resolvedStorageProvider === "cloudinary" &&
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
  ) {
    return new CloudinaryStorage({
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      apiSecret: env.CLOUDINARY_API_SECRET,
    });
  }

  return new LocalDiskStorage(env.LOCAL_STORAGE_DIR, env.PUBLIC_API_URL);
};

export const storage: StorageProvider = createStorage();

export const localStorage: LocalDiskStorage | null = storage instanceof LocalDiskStorage ? storage : null;

export { StorageObjectNotFoundError, type StorageProvider } from "./storage.types";
