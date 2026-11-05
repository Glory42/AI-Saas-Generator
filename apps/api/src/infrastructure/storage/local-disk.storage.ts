import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import {
  StorageObjectNotFoundError,
  isValidStorageKey,
  type StorageProvider,
  type StoredObject,
} from "./storage.types";

export class LocalDiskStorage implements StorageProvider {
  readonly name = "local" as const;
  private readonly root: string;

  constructor(
    rootDir: string,
    private readonly publicBaseUrl: string,
  ) {
    this.root = path.resolve(rootDir);
  }

  // Null for invalid keys or anything resolving outside the storage root.
  resolvePath(key: string): string | null {
    if (!isValidStorageKey(key)) return null;

    const absolute = path.resolve(this.root, key);
    return absolute.startsWith(this.root + path.sep) ? absolute : null;
  }

  async put(key: string, body: Buffer): Promise<StoredObject> {
    const filePath = this.requirePath(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await Bun.write(filePath, body);

    return { key, url: `${this.publicBaseUrl.replace(/\/+$/, "")}/api/files/${key}` };
  }

  async read(key: string): Promise<Buffer> {
    const file = Bun.file(this.requirePath(key));
    if (!(await file.exists())) throw new StorageObjectNotFoundError(key);

    return Buffer.from(await file.arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    await rm(this.requirePath(key), { force: true });
  }

  private requirePath(key: string): string {
    const filePath = this.resolvePath(key);
    if (!filePath) throw new StorageObjectNotFoundError(key);
    return filePath;
  }
}
