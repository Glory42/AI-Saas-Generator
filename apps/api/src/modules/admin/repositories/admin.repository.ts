import { count, desc, eq, ilike, inArray, or, sql, sum } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { generations } from "../../generations/generations.entity";
import { images } from "../../images/images.entity";
import { users, type UserRow } from "../../users/users.entity";
import type { UserUsage } from "../types/admin.types";

// Escapes LIKE wildcards so a search for "a_b" doesn't match "axb".
const containsPattern = (term: string): string => `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

export class AdminRepository {
  static async userCounts(): Promise<{ total: number; admins: number }> {
    const [row] = await db
      .select({ total: count(), admins: count(sql`case when ${users.role} = 'admin' then 1 end`) })
      .from(users);
    return { total: row?.total ?? 0, admins: row?.admins ?? 0 };
  }

  static async imageCount(): Promise<number> {
    const [row] = await db.select({ total: count() }).from(images);
    return row?.total ?? 0;
  }

  static async generationTotals(since: Date) {
    const [row] = await db
      .select({
        total: count(sql`case when ${generations.status} = 'completed' then 1 end`),
        cached: count(sql`case when ${generations.cached} then 1 end`),
        failed: count(sql`case when ${generations.status} = 'failed' then 1 end`),
        recent: count(sql`case when ${generations.createdAt} >= ${since} then 1 end`),
        costUsd: sum(generations.costUsd).mapWith(Number),
      })
      .from(generations);

    return {
      total: row?.total ?? 0,
      cached: row?.cached ?? 0,
      failed: row?.failed ?? 0,
      recent: row?.recent ?? 0,
      costUsd: row?.costUsd ?? 0,
    };
  }

  static async usersPage(page: number, pageSize: number, search: string | undefined) {
    const filter = search ? or(ilike(users.email, containsPattern(search)), ilike(users.username, containsPattern(search))) : undefined;

    const [rows, [totalRow]] = await Promise.all([
      db
        .select()
        .from(users)
        .where(filter)
        .orderBy(desc(users.createdAt), desc(users.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ total: count() }).from(users).where(filter),
    ]);

    return { rows, total: totalRow?.total ?? 0 };
  }

  // Two grouped queries for the whole page instead of one query per user.
  static async usageFor(userIds: string[]): Promise<Map<string, UserUsage>> {
    const usage = new Map<string, UserUsage>(
      userIds.map((id) => [id, { imageCount: 0, generationCount: 0, totalCostUsd: 0 }]),
    );
    if (userIds.length === 0) return usage;

    const [imageRows, generationRows] = await Promise.all([
      db
        .select({ userId: images.userId, total: count() })
        .from(images)
        .where(inArray(images.userId, userIds))
        .groupBy(images.userId),
      db
        .select({ userId: generations.userId, total: count(), costUsd: sum(generations.costUsd).mapWith(Number) })
        .from(generations)
        .where(inArray(generations.userId, userIds))
        .groupBy(generations.userId),
    ]);

    for (const row of imageRows) {
      const entry = usage.get(row.userId);
      if (entry) entry.imageCount = row.total;
    }
    for (const row of generationRows) {
      const entry = usage.get(row.userId);
      if (entry) {
        entry.generationCount = row.total;
        entry.totalCostUsd = row.costUsd ?? 0;
      }
    }

    return usage;
  }

  static async updateRole(userId: string, role: UserRow["role"]): Promise<UserRow | null> {
    const [row] = await db.update(users).set({ role }).where(eq(users.id, userId)).returning();
    return row ?? null;
  }

  static async findUser(userId: string): Promise<UserRow | null> {
    const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return row ?? null;
  }
}

