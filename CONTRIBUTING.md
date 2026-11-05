# Contributing to AI SaaS Generator

Thanks for taking the time to contribute. This guide covers setup, conventions and how to submit
changes. For architecture details, read [`CLAUDE.md`](CLAUDE.md); for domain terms,
[`CONTEXT.md`](CONTEXT.md); for the HTTP contract, [`docs/api.md`](docs/api.md).

## Setup

```bash
bun run install:all
docker compose up -d postgres
cp apps/api/.env.example apps/api/.env   # set JWT_ACCESS_SECRET
(cd apps/api && bun run db:migrate)
bun run dev
```

You don't need any third-party account: without keys the API uses the local-preview AI strategy
and local disk storage.

## Workflow

1. Open or pick a GitHub issue.
2. Branch from `master`: `feat/<short-name>`, `fix/<short-name>` or `refactor/<short-name>`.
3. Commit with [Conventional Commits](https://www.conventionalcommits.org) scoped to the area:
   `feat(images): …`, `fix(web): …`, `docs(adr): …`.
4. Run the checks below, then open a pull request that links the issue.

## Conventions

- **Bun only.** Don't add npm or yarn lockfiles.
- **Types:**
  - Strict TypeScript; no `any`, `@ts-ignore` or non-null `!` on external data.
  - Parse request bodies, env and API responses with Zod.
- **Backend layering:**
  - Follow `routes → controller → service → repository` (`bun run lint:arch` enforces it).
  - Pure rules go in `policies/` with unit tests.
  - Throw `AppError` subclasses; never `res.status(...)` from a service.
- **Database:**
  - Edit the `*.entity.ts` file, then run `bun run db:generate`.
  - Index every column used in `WHERE`/`JOIN`, and keep RLS enabled on new tables (the
    integration suite checks).
- **Frontend:**
  - Feature folders with `api.ts` + `hooks/` + `components/` + `pages/`.
  - Thin route files; `apiRequest()` only; narrow query invalidation; design tokens instead of hex
    colors.
- **Comments:** one line each, explaining *why*.
- **Docs:** update `docs/api.md` for any endpoint change, and add an ADR in `docs/adr/` for any
  decision a future contributor might question.

## Checks

```bash
bun run typecheck
bun run lint
bun run test
bun run test:integration   # needs the local Postgres
```

CI runs the same commands. The pre-commit hook runs the lint checks for whichever app has staged
changes.

## Reporting bugs

Open an issue with steps to reproduce, expected vs. actual behavior, and the `x-request-id`
response header if an API call failed: it matches the server log line.

## Contact

Questions? Reach me at `me@gorkemkaryol.dev`.
