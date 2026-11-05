import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env";
import * as schema from "./entities";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

const hostOf = (connectionString: string): string | null => {
  try {
    return new URL(connectionString).hostname;
  } catch {
    return null;
  }
};

// Tests truncate tables, so they must never reach the Supabase production database.
const assertSafeTestDatabase = (connectionString: string): void => {
  if (env.NODE_ENV !== "test") return;

  const host = hostOf(connectionString);
  if (!host || !LOCAL_HOSTS.has(host)) {
    throw new Error(
      `Refusing to run with NODE_ENV=test against '${host ?? "an unparseable host"}'. ` +
        "Point DATABASE_URL at the local Docker Postgres (docker compose up -d postgres).",
    );
  }
};

assertSafeTestDatabase(env.DATABASE_URL);

// node-postgres only uses unnamed statements by default, which Supabase's transaction pooler (port 6543) requires.
export const pool = new Pool({ connectionString: env.DATABASE_URL, max: env.DATABASE_POOL_MAX });

export const db = drizzle(pool, { schema });

export type Database = typeof db;

export const isDatabaseReachable = async (): Promise<boolean> => {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
};
