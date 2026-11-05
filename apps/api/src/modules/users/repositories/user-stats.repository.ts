import { and, count, desc, eq, sql, sum } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { generations } from "../../generations/generations.entity";
import { images } from "../../images/images.entity";

const completed = (userId: string) => and(eq(generations.userId, userId), eq(generations.status, "completed"));

export class UserStatsRepository {
  static async imageCount(userId: string): Promise<number> {
    const [row] = await db.select({ total: count() }).from(images).where(eq(images.userId, userId));
    return row?.total ?? 0;
  }

  static async generationTotals(userId: string) {
    const [row] = await db
      .select({
        total: count(),
        cached: count(sql`case when ${generations.cached} then 1 end`),
        flash: count(sql`case when ${generations.modelTier} = 'flash' then 1 end`),
        pro: count(sql`case when ${generations.modelTier} = 'pro' then 1 end`),
        costUsd: sum(generations.costUsd).mapWith(Number),
      })
      .from(generations)
      .where(completed(userId));

    return {
      total: row?.total ?? 0,
      cached: row?.cached ?? 0,
      flash: row?.flash ?? 0,
      pro: row?.pro ?? 0,
      costUsd: row?.costUsd ?? 0,
    };
  }

  static async mostUsedTemplateId(userId: string): Promise<string | null> {
    const [row] = await db
      .select({ templateId: generations.templateId, uses: count() })
      .from(generations)
      .where(completed(userId))
      .groupBy(generations.templateId)
      .orderBy(desc(count()), generations.templateId)
      .limit(1);

    return row?.templateId ?? null;
  }
}
