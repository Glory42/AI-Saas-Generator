# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

AI SaaS Generator turns ordinary product photos into marketing-ready shots. A user uploads an
**Image**, picks a **Template** (studio-clean, Instagram promo, lifestyle outdoor…) and the API
produces a **Generation** with a tiered AI pipeline, a per-user result cache and a daily quota.
Admins get system stats, user management and an audit log. Domain terms are defined in
`CONTEXT.md`; the HTTP contract is in `docs/api.md`.

## Commands

### Root
```bash
docker compose up -d postgres   # local stand-in for Supabase Postgres on :5433 (dev + test dbs)
bun run install:all             # install root, api and web dependencies
bun run dev                     # api (:5000) + web (:5173) together
bun run typecheck | lint | test # run across both apps
```

### Backend (run from `apps/api/`)
```bash
bun run dev              # watch mode (port 5000)
bun run typecheck        # tsc --noEmit
bun run lint             # ESLint (max 300 lines per file)
bun run lint:arch        # layer boundary check (rules below)
bun run test:unit        # pure unit tests, no DB
bun run test:integration # HTTP tests against TEST_DATABASE_URL (local Postgres)
bun run db:generate      # drizzle-kit generate after editing an *.entity.ts
bun run db:migrate       # apply migrations to DATABASE_URL
```

### Frontend (run from `apps/web/`)
```bash
bun run dev              # Vite (port 5173, proxies /api to :5000)
bun run typecheck        # tsr generate + tsc -b
bun run lint             # ESLint
bun run test             # Vitest
bun run build            # tsr generate + tsc -b + vite build
bun run routes:generate  # regenerate the TanStack Router tree after adding/renaming routes
```

## Environment

`apps/api/.env` (see `apps/api/.env.example`). Only `DATABASE_URL` and `JWT_ACCESS_SECRET` are
required in development. In production `DATABASE_URL` is the Supabase project's pooled Postgres
connection string; locally it points at the Docker Postgres. **Never run tests against Supabase.**

Without `GEMINI_API_KEY` the API uses the **local preview** strategy
(a deterministic `sharp` filter per template); without Cloudinary credentials it stores files on
disk under `apps/api/storage/` and serves them from `/api/files/*`. Production requires both.

`apps/web/.env`: `VITE_API_BASE_URL` (empty in dev, the Vite proxy handles `/api`).

## Architecture

### Request flow
```
Browser → Vite dev server (proxies /api) → Express 5 on Bun (port 5000)
                                                 ↓
                 helmet · CORS allow-list · trusted-origin check · pino-http · rate limits
                                                 ↓
                         requireAuth (JWT access cookie, transparent refresh)
                                                 ↓
                                   routes → controller → service → repository
                                                 ↓                      ↓
                            infrastructure/ai · infrastructure/storage  Drizzle → Supabase Postgres
```

### Backend layout (`apps/api/src`)
```
index.ts                     # createApp() factory + startServer(); global error handler
commons/                     # cross-cutting: errors, http helpers, middlewares, logger, validation
infrastructure/
  config/env.ts              # Zod-validated env, process exits on invalid config
  database/                  # pg Pool + Drizzle client, entities.ts (schema barrel, FK order)
                             # every table gets RLS enabled (see ADR 0005) — keep it that way
  ai/                        # GenerationStrategy interface + gemini-image, hybrid, local-preview
  storage/                   # StorageProvider interface + cloudinary and local-disk providers
  routing/register-routes.ts # mounts every module router
modules/<module>/            # auth, users, templates, images, generations, admin, audit
```

Every module under `src/modules/<module>/` follows this layout (omit what it doesn't need):
```
<module>.routes.ts      # express Router; every handler wrapped in asyncHandler()
<module>.controller.ts  # static class: parse input with a DTO, call the service, shape the response
<module>.service.ts     # static class: business rules, throws AppError subclasses
<module>.entity.ts      # Drizzle pgTable definitions
dto/                    # Zod schemas for params / body / query
repositories/           # static classes, Drizzle queries only, no business rules
services/               # sub-services when the facade grows
policies/               # pure rule functions (password, quota, lockout) — unit tested
helpers/                # pure utilities and row → response mappers
types/  constants/
```

**Layer rules (`bun run lint:arch`):**
- Controllers must not import repositories or `infrastructure/database`.
- Repositories must not import services, controllers or other modules' services.
- Services must not import controllers.
- DTOs, policies and helpers must not import services, repositories or controllers.

**Errors:** services throw `AppError` subclasses from `commons/errors/app-error.ts`
(`NotFoundError`, `QuotaExceededError`, …). The global handler in `index.ts` turns them into
`{ error: { message, code, details } }`. Unknown errors are logged and returned as a bare 500.
Validate input with `parseInput(schema, value)` from `commons/validation/parse-input.ts`, which
throws a `ValidationError`.

**Auth:** `requireAuth` sets `req.user` (`{ id, email, username, role }`) and `req.session`
(`{ id }`). `optionalAuth` does the same without failing. `requireAdmin` must run after
`requireAuth`. Ownership checks live in services (`ImagesService.getOwned(userId, id)`), never in
middleware.

**Audit log:** `AuditService.record(...)` is fire-and-forget; it must never fail the request.
Action names are dotted: `auth.login`, `auth.login_failed`, `image.uploaded`, `image.generated`,
`admin.user.role_changed`, …

**AI pipeline:** `GenerationsService` builds a cache key (`helpers/cache-key.helper.ts`), checks the
per-user cache, checks the daily quota (`policies/quota.policy.ts`), then runs the strategy chain
from `infrastructure/ai`: `gemini-image` (tier picks the model) → `hybrid` (Gemini writes a prompt,
an external renderer draws it) → error. With no API key the chain is just `local-preview`. Every
strategy returns `{ buffer, mimeType, strategy, costUsd }`.

**Storage:** always go through `storage` from `infrastructure/storage`. Keys are
`uploads/<userId>/<uuid>.webp` and `generations/<userId>/<uuid>.<ext>`. Never put emails or other
PII in keys.

### Frontend layout (`apps/web/src`)
```
routes/                     # TanStack Router file-based routes (thin: guards + page component)
features/<feature>/
  api.ts                    # apiRequest() calls, responses validated with Zod
  hooks/use<Thing>.ts       # React Query hooks + a <feature>Keys factory
  components/               # feature-scoped UI
  pages/                    # page components wired to routes
components/ui/              # shared primitives (button, input, card, badge, dialog, toaster…)
components/layout/          # AppNavbar, AppFooter
lib/
  api-client.ts             # apiRequest<T>(): credentials, timeout, ApiError parsing
  query-client.ts           # QueryClient defaults
  router/auth-guards.ts     # requireAuthenticatedUser / requireGuestUser / requireAdminUser
  format.ts  utils.ts       # formatters, cn()
types/api.ts                # Zod schemas mirroring docs/api.md + inferred types
```

**Routing:** use `beforeLoad` for guards, `loader` + `ensureQueryData` for prefetch,
`validateSearch` for search params. Run `bun run routes:generate` after touching `src/routes/`.

**API calls:** `apiRequest<T>()` only, never raw `fetch`. Parse responses with the schemas in
`types/api.ts`.

**Query keys:** every hooks file exports a `<feature>Keys` factory. Invalidate the narrowest key
that changed, never a whole namespace.

**Styling:** Tailwind CSS v4 with the tokens in `index.css` (`bg-background`, `text-foreground`,
`text-muted-foreground`, `border-border`, `bg-primary`…). Use `cn()` for conditional classes.
No hardcoded hex colors in components.

## Conventions

- Conventional Commits (`feat(api): …`, `fix(web): …`, `refactor(images): …`).
- Bun only. No npm/yarn lockfiles.
- No `any`, no `@ts-ignore`, no non-null `!` on external data. Parse it with Zod.
- One comment line max per comment; explain *why*, not what.
- Max 300 lines per backend file, 330 per frontend file (ESLint `max-lines`).
- New list endpoints are paginated from day one and bounded server-side.
- Independent awaits go in `Promise.all`; never loop a query per row.
- Every new table column used in `WHERE`/`JOIN` gets an index in its entity.

## Adding a backend module

1. Create `src/modules/<module>/` with routes, controller, service, repositories, dto.
2. If it has tables, add `<module>.entity.ts` and export it from
   `src/infrastructure/database/entities.ts` in FK order, then `bun run db:generate`.
3. Mount the router in `src/infrastructure/routing/register-routes.ts`.
4. Document the endpoints in `docs/api.md`.
5. `bun run lint:arch && bun run typecheck && bun test`.

## Adding a frontend feature

1. Create `src/features/<feature>/` with `api.ts` and `hooks/`.
2. Add Zod schemas to `src/types/api.ts`.
3. Add route file(s) under `src/routes/` and run `bun run routes:generate`.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`Glory42/ai-saas-generator`), using the `gh` CLI. See
`docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`,
`wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
