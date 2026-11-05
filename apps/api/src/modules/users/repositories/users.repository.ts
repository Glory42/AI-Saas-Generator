import { eq } from "drizzle-orm";
import { DatabaseError } from "pg";
import { db } from "../../../infrastructure/database/db";
import { users, type UserInsert, type UserRow } from "../users.entity";

const UNIQUE_VIOLATION = "23505";

// Drizzle wraps driver errors, so look one level down for the pg error code.
export const isUniqueViolation = (error: unknown): boolean => {
  const candidate = error instanceof Error && error.cause instanceof DatabaseError ? error.cause : error;
  return candidate instanceof DatabaseError && candidate.code === UNIQUE_VIOLATION;
};

export class UsersRepository {
  static async insert(row: UserInsert): Promise<UserRow> {
    const [created] = await db.insert(users).values(row).returning();
    if (!created) throw new Error("Failed to create user");
    return created;
  }

  static async findById(id: string): Promise<UserRow | null> {
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return row ?? null;
  }

  static async findByEmail(email: string): Promise<UserRow | null> {
    const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return row ?? null;
  }

  static async update(
    id: string,
    changes: Partial<Pick<UserInsert, "email" | "username" | "passwordHash" | "role">>,
  ): Promise<UserRow | null> {
    const [row] = await db.update(users).set(changes).where(eq(users.id, id)).returning();
    return row ?? null;
  }

  static async delete(id: string): Promise<boolean> {
    const deleted = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
    return deleted.length > 0;
  }
}
