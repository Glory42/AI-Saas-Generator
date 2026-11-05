import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

// Runs before any app module is imported, so env.ts sees these values and nothing from apps/api/.env.
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? "postgres://aisg:aisg@localhost:5433/aisg_test";
const host = new URL(testDatabaseUrl).hostname;
if (!["localhost", "127.0.0.1"].includes(host)) {
  throw new Error(`Integration tests only run against a local database, got '${host}'.`);
}

Object.assign(process.env, {
  NODE_ENV: "test",
  DATABASE_URL: testDatabaseUrl,
  DATABASE_POOL_MAX: "5",
  JWT_ACCESS_SECRET: "integration-test-secret-that-is-long-enough",
  CORS_ORIGIN: "http://localhost:5173",
  PUBLIC_API_URL: "http://localhost:5000",
  AI_PROVIDER: "local",
  GEMINI_API_KEY: "",
  STORAGE_PROVIDER: "local",
  CLOUDINARY_CLOUD_NAME: "",
  CLOUDINARY_API_KEY: "",
  CLOUDINARY_API_SECRET: "",
  LOCAL_STORAGE_DIR: mkdtempSync(path.join(tmpdir(), "aisg-test-storage-")),
  GENERATION_DAILY_LIMIT: "3",
});

const pool = new Pool({ connectionString: testDatabaseUrl });
try {
  await migrate(drizzle(pool), { migrationsFolder: path.resolve(import.meta.dir, "../../../drizzle") });
} finally {
  await pool.end();
}
