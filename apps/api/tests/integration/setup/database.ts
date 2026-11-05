import { eq, sql } from "drizzle-orm";
import { db } from "../../../src/infrastructure/database/db";
import { users } from "../../../src/modules/users/users.entity";

export const resetDatabase = async (): Promise<void> => {
  await db.execute(
    sql`TRUNCATE TABLE generations, images, audit_logs, login_attempts, sessions, users RESTART IDENTITY CASCADE`,
  );
};

// There is deliberately no API for self-promotion, so tests promote directly in the database.
export const promoteToAdmin = async (userId: string): Promise<void> => {
  await db.update(users).set({ role: "admin" }).where(eq(users.id, userId));
};

export { db };
