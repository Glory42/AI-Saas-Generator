-- Supabase exposes the public schema through PostgREST to the anon and authenticated roles.
-- RLS with no policies denies those roles every row, while the API connects as the table owner
-- (postgres), which bypasses RLS. See docs/adr/0005-drizzle-on-supabase-postgres.md.
-- Every new table needs the same statement; tests/integration/rls.test.ts enforces it.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "login_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "generations" ENABLE ROW LEVEL SECURITY;
