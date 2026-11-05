import { and, count, desc, eq, gte, min, ne } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { generations, type GenerationInsert, type GenerationRow } from "../generations.entity";

type GenerationUpdate = Partial<
  Pick<GenerationInsert, "status" | "strategy" | "resultUrl" | "resultStorageKey" | "costUsd" | "errorMessage" | "completedAt">
>;

export class GenerationsRepository {
  static async insert(row: GenerationInsert): Promise<GenerationRow> {
    const [created] = await db.insert(generations).values(row).returning();
    if (!created) throw new Error("Failed to create generation");
    return created;
  }

  static async update(id: string, changes: GenerationUpdate): Promise<GenerationRow> {
    const [row] = await db.update(generations).set(changes).where(eq(generations.id, id)).returning();
    if (!row) throw new Error(`Generation ${id} disappeared while updating`);
    return row;
  }

  static async findCompletedByCacheKey(userId: string, cacheKey: string): Promise<GenerationRow | null> {
    const [row] = await db
      .select()
      .from(generations)
      .where(
        and(
          eq(generations.userId, userId),
          eq(generations.cacheKey, cacheKey),
          eq(generations.status, "completed"),
        ),
      )
      .orderBy(desc(generations.createdAt))
      .limit(1);

    return row ?? null;
  }

  // Failed attempts don't use up the quota; completed ones and cache hits do.
  static async usageSince(userId: string, since: Date): Promise<{ used: number; oldest: Date | null }> {
    const [row] = await db
      .select({ used: count(), oldest: min(generations.createdAt) })
      .from(generations)
      .where(
        and(eq(generations.userId, userId), gte(generations.createdAt, since), ne(generations.status, "failed")),
      );

    return { used: row?.used ?? 0, oldest: row?.oldest ?? null };
  }

  static async resultKeysForImage(imageId: string): Promise<string[]> {
    const rows = await db
      .selectDistinct({ key: generations.resultStorageKey })
      .from(generations)
      .where(eq(generations.imageId, imageId));

    return rows.flatMap((row) => (row.key ? [row.key] : []));
  }

  static async resultKeysForUser(userId: string): Promise<string[]> {
    const rows = await db
      .selectDistinct({ key: generations.resultStorageKey })
      .from(generations)
      .where(eq(generations.userId, userId));

    return rows.flatMap((row) => (row.key ? [row.key] : []));
  }

  static async countByResultKey(key: string): Promise<number> {
    const [row] = await db.select({ total: count() }).from(generations).where(eq(generations.resultStorageKey, key));
    return row?.total ?? 0;
  }
}
