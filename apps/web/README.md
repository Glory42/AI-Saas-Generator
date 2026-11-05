# AI SaaS Generator — web

React 19 + Vite SPA for the studio, gallery, settings and admin screens. Architecture and
conventions live in the root [`CLAUDE.md`](../../CLAUDE.md); the API contract it codes against is
[`docs/api.md`](../../docs/api.md).

## Stack

TanStack Router (file-based routes) · TanStack Query · Zod · Tailwind CSS v4 · lucide-react ·
Vitest + Testing Library.

## Scripts

```bash
bun install
bun run dev              # http://localhost:5173, proxies /api to VITE_API_PROXY_TARGET
bun run routes:generate  # regenerate src/routeTree.gen.ts after touching src/routes/
bun run typecheck        # tsr generate + tsc -b
bun run lint             # ESLint (max 330 lines per file)
bun run test             # Vitest
bun run build            # production bundle in dist/
```

## Environment

Copy `.env.example` to `.env`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | empty | API origin in production; empty in dev so the Vite proxy handles `/api` |
| `VITE_API_PROXY_TARGET` | `http://localhost:5000` | Where the dev server proxies `/api` |

Set `VITE_API_BASE_URL` in `.env.production` (or inline at build time) to point a production build at your own API; see `DEPLOYMENT.md`.

## Layout

```
src/
├── routes/            # thin route files: guards (beforeLoad), prefetch (loader), search validation
├── features/<name>/   # api.ts · hooks/ (query options + key factories) · components/ · pages/
├── components/ui/     # shared primitives (button, input, card, badge, dialog, toaster…)
├── components/layout/ # navbar, footer, error boundary, 404
├── lib/               # api-client, query-client, router guards, formatters, toast store
└── types/api.ts       # Zod schemas mirroring docs/api.md
```
