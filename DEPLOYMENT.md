# Self-hosting

There is no hosted instance of this project. This guide covers running your own. The intended
setup is **Supabase** for Postgres, any Docker host for the API (Render, Fly.io, Railway, a VPS…),
**Cloudinary** for image files, and any static host for the web app. The examples below use
`https://app.example.com` for the web app and `https://api.example.com` for the API.

## 1. Supabase

1. Create a project.
2. Go to **Project Settings → Database → Connection string → Transaction pooler** and copy the
   URI (port `6543`). Append `?sslmode=require`. This is `DATABASE_URL`.
3. You don't need any Supabase API keys; the API only speaks Postgres. Migrations enable
   row-level security on every table, so the anon key can't read anything through Supabase's REST
   API (ADR 0005).

Any other Postgres 16 database works the same way; Supabase is just the one the project targets.

## 2. Cloudinary

Copy the cloud name, API key and API secret from the Cloudinary dashboard.

## 3. API

Build `apps/api/Dockerfile` with `apps/api` as the build context. On start, the container applies
pending migrations and then serves on `PORT` (default `5000`). Use `/api/health/ready` as the
health check path.

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase pooler URI from step 1 |
| `JWT_ACCESS_SECRET` | `openssl rand -base64 48` |
| `CORS_ORIGIN` | The web app's origin, e.g. `https://app.example.com` (comma-separate extra origins) |
| `PUBLIC_API_URL` | The API's public URL, e.g. `https://api.example.com` |
| `GEMINI_API_KEY` | From [Google AI Studio](https://aistudio.google.com/) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | From step 2 |

Optional: `GENERATION_DAILY_LIMIT`, `HYBRID_RENDERER`, `GEMINI_*_MODEL`, `DATABASE_POOL_MAX`. See
`apps/api/.env.example`. In production the API refuses to boot without Gemini and Cloudinary.

The API trusts one proxy hop for client IPs (`trust proxy = 1`), which matches most PaaS hosts.
Adjust it in `apps/api/src/index.ts` if yours differs.

## 4. Web app

```bash
cd apps/web
bun install
VITE_API_BASE_URL=https://api.example.com bun run build
```

Serve `apps/web/dist` as a single-page app: rewrite every unknown path to `/index.html`.

## 5. Make an admin

Register through the web app, then promote yourself once in the Supabase SQL editor:

```sql
update users set role = 'admin' where email = 'you@example.com';
```

After that, admins can promote other users from the admin console.

## Cookies across domains

In production, session cookies are `SameSite=None; Secure`. Chrome and Firefox accept them when
the web app and API are on unrelated domains, but Safari blocks third-party cookies. Serve both
from the same site (`app.example.com` and `api.example.com`) to keep the cookies first-party in
every browser.
