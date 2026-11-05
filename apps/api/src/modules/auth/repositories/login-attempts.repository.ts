import { and, count, desc, eq, gte, min } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { loginAttempts } from "../auth.entity";

export class LoginAttemptsRepository {
  static async record(email: string, ipAddress: string | null, succeeded: boolean): Promise<void> {
    await db.insert(loginAttempts).values({ email, ipAddress, succeeded });
  }

  static recentForEmail(email: string, limit: number) {
    return db
      .select({ succeeded: loginAttempts.succeeded, createdAt: loginAttempts.createdAt })
      .from(loginAttempts)
      .where(eq(loginAttempts.email, email))
      .orderBy(desc(loginAttempts.createdAt))
      .limit(limit);
  }

  static async failuresForIpSince(ipAddress: string, since: Date): Promise<{ total: number; oldest: Date | null }> {
    const [row] = await db
      .select({ total: count(), oldest: min(loginAttempts.createdAt) })
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.ipAddress, ipAddress),
          eq(loginAttempts.succeeded, false),
          gte(loginAttempts.createdAt, since),
        ),
      );

    return { total: row?.total ?? 0, oldest: row?.oldest ?? null };
  }
}
