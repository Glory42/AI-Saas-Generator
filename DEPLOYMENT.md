# Deployment

Production runs on three services: **Supabase** (Postgres), **Render** (the API, from
`apps/api/Dockerfile`) and **Cloudinary** (image files). The web app is a static Vite build that
any static host can serve.

## 1. Supabase

1. Create a project.
2. Go to **Project Settings → Database → Connection string → Transaction pooler** and copy the
   URI (port `6543`). Append `?sslmode=require`. This is `DATABASE_URL`.
3. You don't need any Supabase API keys. The API only speaks Postgres. Migrations enable row-level
   security on every table, so the anon key can't read anything through Supabase's REST API
   (ADR 0005).

## 2. Cloudinary

Copy the cloud name, API key and API secret from the Cloudinary dashboard.

## 3. API on Render

Create a **Web Service** from this repo with these settings:

- Root directory: `apps/api`
- Runtime: Docker
- Dockerfile: `apps/api/Dockerfile`

The container applies pending migrations, then starts the server. Set these environment variables:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase pooler URI from step 1 |
| `JWT_ACCESS_SECRET` | `openssl rand -base64 48` |
| `CORS_ORIGIN` | `https://saas.gorkemkaryol.dev` (comma-separate extra origins) |
| `PUBLIC_API_URL` | The API's public URL |
| `GEMINI_API_KEY` | From Google AI Studio |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | From step 2 |

Optional: `GENERATION_DAILY_LIMIT`, `HYBRID_RENDERER`, `GEMINI_*_MODEL`, `DATABASE_POOL_MAX`. See
`apps/api/.env.example`. The API refuses to boot in production if Gemini or Cloudinary is missing.

Use `/api/health/ready` as the Render health check path.

## 4. Web app

Build with `cd apps/web && bun install && bun run build` and serve `apps/web/dist` as a single-page
app: rewrite every unknown path to `/index.html`. Set `VITE_API_BASE_URL` to the API URL at build
time. `apps/web/.env.production` already points at `https://ai-saas-generator.onrender.com`.

## Cookies across domains

Session cookies are `SameSite=None; Secure` in production. Chrome and Firefox accept them between
`saas.gorkemkaryol.dev` and `*.onrender.com`, but Safari blocks third-party cookies. Give the
Render service a custom domain under the web app's domain (for example
`api.saas.gorkemkaryol.dev`), then update `VITE_API_BASE_URL` and `PUBLIC_API_URL`. That keeps the
cookies first-party everywhere.

## Migrating data from the first version

The first version's tables (`users`, `images`, `refresh_tokens`, `token_blacklist`,
`failed_login_attempts`, `account_lockouts`, `audit_logs`) don't match the new schema. The simplest
path is a fresh Supabase project. To keep existing accounts, copy `users` into the new table
(`password` → `password_hash`). `Bun.password.verify` reads the algorithm from the hash, so the
old bcrypt hashes keep working and new passwords are stored as argon2id. Copy old `images` rows
into `images` + `generations` with a one-off SQL script.
