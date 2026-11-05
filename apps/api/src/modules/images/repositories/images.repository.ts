import { and, desc, eq, inArray, lt, or } from "drizzle-orm";
import type { Cursor } from "../../../commons/helpers/cursor.helper";
import { db } from "../../../infrastructure/database/db";
import { generations, type GenerationRow } from "../../generations/generations.entity";
import { images, type ImageInsert, type ImageRow } from "../images.entity";

export class ImagesRepository {
  static async insert(row: ImageInsert): Promise<ImageRow> {
    const [created] = await db.insert(images).values(row).returning();
    if (!created) throw new Error("Failed to create image");
    return created;
  }

  static async findOwned(userId: string, imageId: string): Promise<ImageRow | null> {
    const [row] = await db
      .select()
      .from(images)
      .where(and(eq(images.id, imageId), eq(images.userId, userId)))
      .limit(1);

    return row ?? null;
  }

  // Fetches limit + 1 rows so the caller can tell whether another page exists.
  static listPage(userId: string, limit: number, cursor: Cursor | null): Promise<ImageRow[]> {
    return db
      .select()
      .from(images)
      .where(
        and(
          eq(images.userId, userId),
          cursor
            ? or(
                lt(images.createdAt, cursor.createdAt),
                and(eq(images.createdAt, cursor.createdAt), lt(images.id, cursor.id)),
              )
            : undefined,
        ),
      )
      .orderBy(desc(images.createdAt), desc(images.id))
      .limit(limit + 1);
  }

  // One query for every image on the page, newest generation first.
  static async generationsFor(imageIds: string[]): Promise<GenerationRow[]> {
    if (imageIds.length === 0) return [];

    return db
      .select()
      .from(generations)
      .where(inArray(generations.imageId, imageIds))
      .orderBy(desc(generations.createdAt), desc(generations.id));
  }

  static async delete(imageId: string): Promise<void> {
    await db.delete(images).where(eq(images.id, imageId));
  }

  static async storageKeysForUser(userId: string): Promise<string[]> {
    const rows = await db.select({ key: images.storageKey }).from(images).where(eq(images.userId, userId));
    return rows.map((row) => row.key);
  }
}
