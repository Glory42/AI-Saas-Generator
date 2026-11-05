# Drizzle ORM on Supabase Postgres instead of the supabase-js client

The first version talked to the database through `@supabase/supabase-js` (PostgREST over HTTP)
with hand-written row interfaces, created three separate clients in three files, and kept the
schema only as SQL snippets in the README. It also used the anon key server-side, and the tables
had no row-level security, so anyone holding that key could query `users` (password hashes
included) straight through Supabase's REST API.

Supabase stays the production database. The API connects to it over the Postgres wire protocol
with Drizzle ORM and `pg`, using the project's pooled connection string as `DATABASE_URL`. The
schema lives in `*.entity.ts` files next to their modules, migrations are generated into
`apps/api/drizzle/`, and query results are typed from the schema. A migration enables RLS on every
table with no policies: the API's `postgres` role bypasses RLS, while the anon and authenticated
roles that PostgREST uses see nothing.

## Consequences

- Local dev and CI run against a plain `postgres:16` container (`docker compose up -d postgres`)
  that stands in for Supabase; the same migrations apply to both.
- No Supabase keys are needed by the API at all, only the connection string.
- Existing production data in the old tables needs a one-off copy into the new schema; the old
  `token_blacklist`, `account_lockouts` and `refresh_tokens` tables are not carried over.
