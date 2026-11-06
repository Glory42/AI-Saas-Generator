# AI SaaS Generator

Turn ordinary product photos into marketing-ready shots. Upload a photo, pick a style, and get an
AI-rendered result you can download and revisit later.

> **Status:** this project used to run live, with the database on Supabase and the API on Render.
> That deployment has been shut down, so there is no hosted demo. The code is complete, though:
> clone it and run it locally in a few minutes with no API keys (see [Quick start](#quick-start)).
> Or deploy your own copy on the same services or any alternatives (see
> [DEPLOYMENT.md](DEPLOYMENT.md)).

- **Tiered AI pipeline:** each style runs on a `flash` or `pro` Gemini image model. If that fails, a
  hybrid fallback has Gemini write a detailed prompt for an external renderer.
- **Content-addressed cache:** re-rendering the same photo with the same style costs nothing and
  returns instantly.
- **Quotas and cost tracking:** a rolling 24-hour generation quota per user, with an estimated cost
  recorded on every generation.
- **Gallery:** every photo keeps all its renders, including failed attempts.
- **Admin console:** system stats, user management and an audit log of security-relevant actions.
- **Hardened auth:**
  - `httpOnly` cookie sessions with rotating refresh tokens
  - argon2id password hashing
  - login lockout and a trusted-origin check on mutations

## Tech stack

| Layer | Tech |
| --- | --- |
| Runtime | Bun |
| Backend | Express 5 + TypeScript, Zod, pino |
| Database | Supabase (PostgreSQL), with row-level security on every table |
| ORM | Drizzle ORM + drizzle-kit migrations |
| Auth | In-house: JWT access cookie (`jose`) + rotating refresh sessions, argon2id via `Bun.password` |
| AI | Google Gemini (`@google/genai`) with image-model tiers and a hybrid fallback |
| Storage | Cloudinary, or local disk in development |
| Frontend | React 19 + Vite |
| Routing / data | TanStack Router (file-based) + TanStack Query |
| UI | Tailwind CSS v4, lucide icons |
| Testing | `bun test` (unit + HTTP integration against Postgres), Vitest + Testing Library |
| Tooling | ESLint, an architecture-boundary check, Husky + lint-staged, GitHub Actions, Docker |

## Repository layout

```text
.
├── apps/api/          # Express API: domain modules, Drizzle schema + migrations, AI/storage providers
├── apps/web/          # React SPA: TanStack Router routes, feature folders, UI primitives
├── docs/api.md        # HTTP contract (every endpoint, shape and error code)
├── docs/adr/          # Architecture decision records
├── CONTEXT.md         # Domain glossary (Image, Generation, Template, Strategy, Cache hit…)
├── DEPLOYMENT.md      # Self-hosting guide (Supabase, Docker, Cloudinary)
└── docker-compose.yml # Local Postgres standing in for Supabase
```

## Architecture

```text
Browser ─▶ React SPA (TanStack Router + Query)
             │  fetch, credentials: include
             ▼
Express 5 on Bun ─ helmet · CORS allow-list · trusted-origin · rate limits · pino-http
             │
        requireAuth (JWT access cookie, transparent refresh)
             │
   routes ─▶ controller ─▶ service ─▶ repository ─▶ Drizzle ─▶ Supabase Postgres
                              │
                              ├─▶ infrastructure/ai       gemini-image ▸ hybrid ▸ (local-preview)
                              └─▶ infrastructure/storage  cloudinary ▸ (local disk)
```

Every backend module has the same layers (`routes → controller → service → repository`, Zod DTOs,
pure `policies/`). `bun run lint:arch` enforces the boundaries. The generation flow is:

1. Load the image (owner-only).
2. Resolve the template and check the daily quota.
3. Look up the per-user cache by `sha256(contentHash, template, promptVersion, tier)`.
4. On a miss, record a `pending` generation and run the strategy chain.
5. Store the result and mark it `completed` or `failed`.

See [`docs/adr/`](docs/adr) for why things are the way they are.

## Quick start

Prerequisites: Bun 1.3+ and Docker.

```bash
git clone https://github.com/Glory42/ai-saas-generator.git
cd ai-saas-generator
bun run install:all

docker compose up -d postgres                 # local Postgres on :5433
cp apps/api/.env.example apps/api/.env        # then set JWT_ACCESS_SECRET (openssl rand -base64 48)
cp apps/web/.env.example apps/web/.env
(cd apps/api && bun run db:migrate)

bun run dev                                   # API on :5000, web on :5173
```

Open http://localhost:5173 and create an account. To see the admin console, promote yourself:

```bash
docker compose exec postgres psql -U aisg -d aisg \
  -c "update users set role = 'admin' where email = 'you@example.com';"
```

No Gemini or Cloudinary account is needed to try it locally. Without keys, the API renders with a
deterministic local filter per template and stores files on disk. Add `GEMINI_API_KEY` and the
`CLOUDINARY_*` variables to `apps/api/.env` to use the real services.

## Templates

| Template | Tier |
| --- | --- |
| E-Commerce Clean | flash |
| Minimal Flat Lay | flash |
| Holiday Festive | flash |
| Instagram Promo | pro |
| Lifestyle Outdoor | pro |
| Luxury Dark | pro |

Templates live in `apps/api/src/modules/templates/constants`. Their prompts never leave the server.
Bumping a template's `promptVersion` invalidates its cached results.

## API

The full contract is in [`docs/api.md`](docs/api.md). In short:

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` · `/login` · `/logout` · `/logout-all` | Cookie sessions |
| `GET` | `/api/auth/session` | Current user or `null` |
| `PATCH` `POST` `DELETE` | `/api/users/me` · `/me/password` | Profile, password, account deletion |
| `GET` | `/api/users/me/stats` | Usage, cost and quota |
| `GET` | `/api/templates` | Available styles |
| `POST` `GET` | `/api/images` | Upload (multipart) / list with generations (cursor-paginated) |
| `GET` `DELETE` | `/api/images/:id` | One image with all its generations |
| `POST` | `/api/images/:id/generations` | Render an image with a template |
| `GET` `PATCH` `DELETE` | `/api/admin/*` | Stats, users, roles, audit log (admin only) |

## Quality checks

```bash
bun run typecheck         # both apps
bun run lint              # ESLint + architecture boundaries
bun run test              # API unit tests + web tests
bun run test:integration  # API HTTP tests against the local Postgres
```

CI runs all of the above on every pull request ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Roadmap

See [ROADMAP.md](ROADMAP.md).

## License

GNU General Public License v3.0. See [LICENSE](LICENSE).

## Contact

Questions? Reach me at `me@gorkemkaryol.dev`.
