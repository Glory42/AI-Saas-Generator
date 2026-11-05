# API reference

Base path: `/api`. All bodies are JSON unless noted. Auth is cookie-based; browsers must send
requests with `credentials: "include"`.

## Conventions

### Errors

Every non-2xx response has the same shape:

```json
{ "error": { "message": "Human readable", "code": "VALIDATION_ERROR", "details": {} } }
```

`details` is only present for validation errors (Zod's flattened error) and the 429s:
`ACCOUNT_LOCKED` → `{ "retryAfterSeconds": 900 }`, `QUOTA_EXCEEDED` → `{ "limit": 20, "resetsAt": "…" }`.

| Code | Status | Meaning |
| --- | --- | --- |
| `BAD_REQUEST` | 400 | Request is well-formed but not acceptable |
| `VALIDATION_ERROR` | 400 | Body, params or query failed schema validation |
| `MALFORMED_BODY` | 400 | Body is not valid JSON |
| `UNSUPPORTED_MEDIA` | 415 | Upload is not a JPEG, PNG or WebP image |
| `UNAUTHORIZED` | 401 | Missing, expired or revoked session |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password (never says which) |
| `FORBIDDEN` | 403 | Authenticated but not allowed |
| `CORS_NOT_ALLOWED` | 403 | Mutation from an untrusted `Origin` (reads from one just get no CORS headers) |
| `NOT_FOUND` | 404 | Resource does not exist or is not yours |
| `CONFLICT` | 409 | Unique constraint (email taken) |
| `PAYLOAD_TOO_LARGE` | 413 | Body or upload over the limit |
| `ACCOUNT_LOCKED` | 429 | Too many failed logins for this email |
| `QUOTA_EXCEEDED` | 429 | Daily generation quota used up |
| `TOO_MANY_REQUESTS` | 429 | IP rate limit |
| `GENERATION_FAILED` | 502 | Every generation strategy failed |
| `SERVICE_UNAVAILABLE` | 503 | A dependency (DB, AI provider) is down |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected; details are logged, never returned |

### Pagination

Growing collections (images, audit logs) use keyset pagination:
`?limit=20&cursor=<opaque>` → `{ "items": [...], "nextCursor": "..." | null }`.
`limit` defaults to 20, max 50. The cursor is opaque: pass back what you got.

The admin user table uses page-based pagination (`?page=1&pageSize=20`) because it needs a total.

### Shared types

```ts
type Role = "user" | "admin";
type ModelTier = "flash" | "pro";
type GenerationStatus = "pending" | "completed" | "failed";

type User = {
  id: string;            // uuid
  email: string;
  username: string;
  role: Role;
  createdAt: string;     // ISO 8601
};

type Template = {
  id: string;            // slug, e.g. "ecommerce-clean"
  label: string;
  description: string;
  modelTier: ModelTier;
};

type Image = {
  id: string;
  originalUrl: string;
  width: number;
  height: number;
  createdAt: string;
};

type Generation = {
  id: string;
  imageId: string;
  templateId: string;
  modelTier: ModelTier;
  status: GenerationStatus;
  resultUrl: string | null;
  costUsd: number;       // estimated, 0 for cache hits
  cached: boolean;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

type ImageWithGenerations = Image & { generations: Generation[] }; // newest first

type UsageStats = {
  totalImages: number;
  totalGenerations: number;
  cachedGenerations: number;
  totalCostUsd: number;
  generationsByTier: { flash: number; pro: number };
  mostUsedTemplateId: string | null;
  quota: { limit: number | null; used: number; resetsAt: string }; // limit null = unlimited (admin)
};
```

## Health

| Method | Path | Response |
| --- | --- | --- |
| `GET` | `/api/health` | `{ "status": "ok" }` — liveness, never touches the DB |
| `GET` | `/api/health/ready` | `{ "status": "ok", "database": "up" }` or 503 |

## Auth — `/api/auth`

Sessions use two `httpOnly` cookies: a short-lived JWT access token and an opaque refresh token
that is rotated on every refresh. The refresh token is stored hashed (SHA-256) server-side, so a
database leak does not leak live sessions. An expired access token is refreshed transparently by
any authenticated endpoint when a valid refresh cookie is present.

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| `POST` | `/register` | — | `{ email, password, username }` | `201 { user }` + cookies |
| `POST` | `/login` | — | `{ email, password }` | `200 { user }` + cookies |
| `POST` | `/refresh` | refresh cookie | — | `200 { user }` + rotated cookies |
| `POST` | `/logout` | — | — | `200 { success: true }`, revokes this session |
| `POST` | `/logout-all` | ✅ | — | `200 { success: true }`, revokes every session |
| `GET` | `/session` | optional | — | `200 { user: User \| null }` — never 401 |

Rules:
- `password`: 8–128 characters. `username`: 3–32 characters of `[a-zA-Z0-9_.-]`. Emails are
  lower-cased.
- Five consecutive failed logins for one email within 15 minutes lock that email for 15 minutes
  (`429 ACCOUNT_LOCKED`, `details.retryAfterSeconds`). Twenty failures from one IP within an hour
  do the same for the IP.
- Login failures always return `401 INVALID_CREDENTIALS`, whether or not the email exists.

## Users — `/api/users` (all ✅)

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| `PATCH` | `/me` | `{ username?, email? }` (at least one) | `{ user }` |
| `POST` | `/me/password` | `{ currentPassword, newPassword }` | `{ success: true }`, revokes other sessions |
| `DELETE` | `/me` | `{ currentPassword }` | `204`, deletes images and stored files too |
| `GET` | `/me/stats` | — | `{ stats: UsageStats }` |

`role` is not accepted on `PATCH /me`; unknown keys are rejected (`VALIDATION_ERROR`).
A wrong `currentPassword` returns `400 BAD_REQUEST`, not 401, so clients don't mistake it for an
expired session.

## Templates — `/api/templates` (public)

| Method | Path | Response |
| --- | --- | --- |
| `GET` | `/` | `{ templates: Template[] }` |
| `GET` | `/:id` | `{ template }` or 404 |

System prompts stay server-side and are never returned.

## Images — `/api/images` (all ✅)

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| `POST` | `/` | `multipart/form-data`, field `image` | `201 { image: Image }` |
| `GET` | `/` | `?limit&cursor` | `{ items: ImageWithGenerations[], nextCursor }` |
| `GET` | `/:id` | — | `{ image: ImageWithGenerations }` |
| `DELETE` | `/:id` | — | `204`, deletes stored files no other generation still uses |
| `POST` | `/:id/generations` | `{ templateId }` | `201 { generation: Generation, cached: boolean }` |

Upload rules: JPEG, PNG or WebP, at most 10 MB and 8000 px per side. The format is checked from
the file's bytes, not its name or `Content-Type`. Uploads are auto-rotated from EXIF, stripped of
metadata (GPS included) and re-encoded as WebP before storage.

Generation rules:
- Non-admins get `GENERATION_DAILY_LIMIT` generations per rolling 24 hours (default 20).
  Cache hits count too. Over the limit: `429 QUOTA_EXCEEDED`.
- A repeat of the same image bytes + template + tier for the same user is served from the cache:
  no AI call, `costUsd: 0`, `cached: true`.
- If every strategy fails, the generation is stored with `status: "failed"` and the request
  returns `502 GENERATION_FAILED`.

## Admin — `/api/admin` (✅ admin only)

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| `GET` | `/stats` | — | `{ stats: AdminStats }` |
| `GET` | `/users` | `?page&pageSize&search` | `{ items: AdminUser[], page, pageSize, total }` |
| `PATCH` | `/users/:id/role` | `{ role }` | `{ user }` — not on yourself (400) |
| `DELETE` | `/users/:id` | — | `204` — not on yourself (400) |
| `GET` | `/audit-logs` | `?limit&cursor` | `{ items: AuditLog[], nextCursor }` |

```ts
type AdminStats = {
  totalUsers: number;
  adminUsers: number;
  totalImages: number;
  totalGenerations: number;
  cachedGenerations: number;
  failedGenerations: number;
  generationsLast24h: number;
  totalCostUsd: number;
};

type AdminUser = User & { imageCount: number; generationCount: number; totalCostUsd: number };

type AuditLog = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;          // e.g. "auth.login", "image.generated", "admin.user.role_changed"
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
};
```

`search` matches email or username, case-insensitive.
