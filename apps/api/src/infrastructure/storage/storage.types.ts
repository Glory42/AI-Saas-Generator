export type StoredObject = { key: string; url: string };

export interface StorageProvider {
  readonly name: "cloudinary" | "local";
  put(key: string, body: Buffer, mimeType: string): Promise<StoredObject>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

export class StorageObjectNotFoundError extends Error {
  constructor(key: string) {
    super(`Stored object not found: ${key}`);
    this.name = "StorageObjectNotFoundError";
  }
}

// Keys are generated server-side; anything else is a bug or a traversal attempt.
const STORAGE_KEY_PATTERN = /^(uploads|generations)\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|png|jpg)$/;

export const isValidStorageKey = (key: string): boolean => STORAGE_KEY_PATTERN.test(key);
