import { randomUUID } from "node:crypto";
import { NotFoundError } from "../../commons/errors/app-error";
import type { ClientInfo } from "../../commons/http/request-context";
import { decodeCursor, toPage, type Page } from "../../commons/helpers/cursor.helper";
import { logger } from "../../commons/utils/logger";
import { storage } from "../../infrastructure/storage";
import { AuditService } from "../audit/audit.service";
import { AUDIT_ACTIONS } from "../audit/constants/audit-actions.constants";
import type { GenerationRow } from "../generations/generations.entity";
import { GenerationsRepository } from "../generations/repositories/generations.repository";
import { normalizeUpload } from "./helpers/normalize-upload.helper";
import type { ImageRow } from "./images.entity";
import { ImagesRepository } from "./repositories/images.repository";
import type { ImageWithGenerationRows } from "./types/images.types";

const attachGenerations = (imageRows: ImageRow[], generationRows: GenerationRow[]): ImageWithGenerationRows[] => {
  const byImage = new Map<string, GenerationRow[]>();
  for (const generation of generationRows) {
    const list = byImage.get(generation.imageId) ?? [];
    list.push(generation);
    byImage.set(generation.imageId, list);
  }

  return imageRows.map((image) => ({ ...image, generations: byImage.get(image.id) ?? [] }));
};

export class ImagesService {
  static async upload(userId: string, file: Buffer, client: ClientInfo): Promise<ImageRow> {
    const normalized = await normalizeUpload(file);
    const stored = await storage.put(`uploads/${userId}/${randomUUID()}.webp`, normalized.buffer, normalized.mimeType);

    const image = await ImagesRepository.insert({
      userId,
      storageKey: stored.key,
      originalUrl: stored.url,
      mimeType: normalized.mimeType,
      width: normalized.width,
      height: normalized.height,
      sizeBytes: normalized.sizeBytes,
      contentHash: normalized.contentHash,
    });

    AuditService.record({
      actorId: userId,
      action: AUDIT_ACTIONS.imageUploaded,
      metadata: { imageId: image.id, sizeBytes: image.sizeBytes },
      ipAddress: client.ipAddress,
    });
    return image;
  }

  static async getOwned(userId: string, imageId: string): Promise<ImageRow> {
    const image = await ImagesRepository.findOwned(userId, imageId);
    if (!image) throw new NotFoundError("Image not found");
    return image;
  }

  static async getOwnedWithGenerations(userId: string, imageId: string): Promise<ImageWithGenerationRows> {
    const image = await ImagesService.getOwned(userId, imageId);
    const generationRows = await ImagesRepository.generationsFor([image.id]);
    return { ...image, generations: generationRows };
  }

  static async listPage(userId: string, limit: number, cursor: string | undefined): Promise<Page<ImageWithGenerationRows>> {
    const rows = await ImagesRepository.listPage(userId, limit, decodeCursor(cursor));
    const page = toPage(rows, limit, (row) => row);
    const generationRows = await ImagesRepository.generationsFor(page.items.map((image) => image.id));

    return { items: attachGenerations(page.items, generationRows), nextCursor: page.nextCursor };
  }

  static async delete(userId: string, imageId: string, client: ClientInfo): Promise<void> {
    const image = await ImagesService.getOwned(userId, imageId);
    const resultKeys = await GenerationsRepository.resultKeysForImage(image.id);

    await ImagesRepository.delete(image.id);

    // Cache hits on other images may still point at these results (ADR 0003).
    const counts = await Promise.all(resultKeys.map((key) => GenerationsRepository.countByResultKey(key)));
    const orphanedKeys = resultKeys.filter((_key, index) => counts[index] === 0);
    await ImagesService.deleteFiles([image.storageKey, ...orphanedKeys]);

    AuditService.record({
      actorId: userId,
      action: AUDIT_ACTIONS.imageDeleted,
      metadata: { imageId: image.id },
      ipAddress: client.ipAddress,
    });
  }

  // Collect before deleting the user: the rows that know the keys cascade away with it.
  static async collectUserFiles(userId: string): Promise<string[]> {
    const [uploadKeys, resultKeys] = await Promise.all([
      ImagesRepository.storageKeysForUser(userId),
      GenerationsRepository.resultKeysForUser(userId),
    ]);
    return [...uploadKeys, ...resultKeys];
  }

  // Best effort: a leftover file is cheaper than failing a delete the user already confirmed.
  static async deleteFiles(keys: string[]): Promise<void> {
    const results = await Promise.allSettled(keys.map((key) => storage.delete(key)));
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        logger.warn({ err: result.reason, key: keys[index] }, "Failed to delete stored file");
      }
    });
  }
}
