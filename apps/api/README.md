# @aisg/api

Express 5 API on Bun: auth, image uploads, the AI generation pipeline and admin tooling.
Architecture, layer rules and conventions are in the root [`CLAUDE.md`](../../CLAUDE.md); the HTTP
contract is [`docs/api.md`](../../docs/api.md).

## Setup

```bash
docker compose up -d postgres        # from the repo root: local stand-in for Supabase on :5433
cp .env.example .env                 # set JWT_ACCESS_SECRET (openssl rand -base64 48)
bun install
bun run db:migrate
bun run dev                          # http://localhost:5000
```

With no `GEMINI_API_KEY` or Cloudinary credentials the API runs fully offline: generations use
the `local-preview` strategy and files are stored under `./storage`.

## Scripts

| Script | What it does |
| --- | --- |
| `dev` / `start` | Run the server (watch mode / once) |
| `typecheck` | `tsc --noEmit` |
| `lint` | ESLint, including the 300-line file limit |
| `lint:arch` | Layer-boundary check (`scripts/architecture-check.ts`) |
| `test:unit` | Pure unit tests, no database |
| `test:integration` | HTTP tests against `TEST_DATABASE_URL` (default: the local `aisg_test` db) |
| `db:generate` | Generate a migration after changing an `*.entity.ts` |
| `db:migrate` | Apply migrations to `DATABASE_URL` |

Tests never read `.env` and refuse to run against anything but localhost.

## Production (Supabase)

`DATABASE_URL` is the Supabase transaction-pooler connection string with `?sslmode=require`.
Every table has row-level security enabled (migration `0001_enable_rls.sql`), so Supabase's
PostgREST API exposes nothing; the API connects as the table owner and is unaffected. The Docker
image applies pending migrations on start.
