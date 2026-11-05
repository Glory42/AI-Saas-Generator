import { describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { db } from "./setup/database";

// Supabase serves the public schema over PostgREST; a table without RLS is readable with the anon key.
describe("row level security", () => {
  test("every table in the public schema has RLS enabled", async () => {
    const result = await db.execute<{ tablename: string; rowsecurity: boolean }>(
      sql`select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename not like '__drizzle%'`,
    );

    expect(result.rows.length).toBeGreaterThan(0);
    const unprotected = result.rows.filter((row) => !row.rowsecurity).map((row) => row.tablename);
    expect(unprotected).toEqual([]);
  });
});
