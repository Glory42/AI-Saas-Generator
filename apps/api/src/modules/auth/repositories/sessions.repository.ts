import { and, eq, gt, isNull, ne } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { users } from "../../users/users.entity";
import { sessions, type SessionInsert, type SessionRow } from "../auth.entity";

const isActive = () => and(isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date()));

export class SessionsRepository {
  static async insert(row: SessionInsert): Promise<SessionRow> {
    const [created] = await db.insert(sessions).values(row).returning();
    if (!created) throw new Error("Failed to create session");
    return created;
  }

  // Runs on every authenticated request, so session + user come back in one round trip.
  static async findActiveWithUser(sessionId: string) {
    const [row] = await db
      .select({ sessionId: sessions.id, user: users })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.id, sessionId), isActive()))
      .limit(1);

    return row ?? null;
  }

  // Atomic swap: a refresh token can only be exchanged once, even under concurrent requests.
  static async rotate(
    currentHash: string,
    next: { refreshTokenHash: string; expiresAt: Date; ipAddress: string | null; userAgent: string | null },
  ): Promise<SessionRow | null> {
    const [row] = await db
      .update(sessions)
      .set({ ...next, previousRefreshTokenHash: currentHash, rotatedAt: new Date(), lastUsedAt: new Date() })
      .where(and(eq(sessions.refreshTokenHash, currentHash), isActive()))
      .returning();

    return row ?? null;
  }

  // Parallel requests can all carry the refresh token that one of them just rotated away.
  static async findRecentlyRotatedWithUser(previousHash: string, rotatedAfter: Date) {
    const [row] = await db
      .select({ sessionId: sessions.id, user: users })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(
          eq(sessions.previousRefreshTokenHash, previousHash),
          gt(sessions.rotatedAt, rotatedAfter),
          isActive(),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  static async revokeByRefreshHash(hash: string): Promise<string | null> {
    const [row] = await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.refreshTokenHash, hash), isNull(sessions.revokedAt)))
      .returning({ userId: sessions.userId });

    return row?.userId ?? null;
  }

  static async revokeById(sessionId: string): Promise<void> {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)));
  }

  static async revokeAllForUser(userId: string, exceptSessionId?: string): Promise<void> {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(sessions.userId, userId),
          isNull(sessions.revokedAt),
          exceptSessionId ? ne(sessions.id, exceptSessionId) : undefined,
        ),
      );
  }
}
