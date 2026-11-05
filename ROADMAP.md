# Roadmap

## Done

### Platform
- [x] Monorepo (`apps/api`, `apps/web`) with shared tooling, Husky + lint-staged, GitHub Actions CI
- [x] Drizzle schema + migrations on Supabase Postgres, row-level security on every table
- [x] Zod-validated environment; production refuses to boot without its real providers
- [x] Structured logging with request ids (pino), graceful shutdown, liveness + readiness checks

### Security
- [x] `httpOnly` cookie sessions, rotating hashed refresh tokens, argon2id passwords
- [x] Login lockout per email and per IP; one error for unknown email and wrong password
- [x] CORS allow-list plus a trusted-origin check on every mutation
- [x] Upload validation from file bytes (not MIME or extension); EXIF/GPS stripped on upload
- [x] Prompts stay server-side; provider errors are never returned to clients
- [x] Audit log of auth, generation and admin actions

### Cost control
- [x] Model tiers per template (`flash` / `pro`)
- [x] Per-user, content-addressed result cache (cache hits cost $0)
- [x] Rolling 24-hour generation quota per user, admins exempt
- [x] Estimated cost recorded on every generation, aggregated in user and admin stats

### Product
- [x] Studio: upload → pick a style → before/after → download
- [x] Gallery with every render per photo, including failed attempts
- [x] Settings: profile, password, sign out everywhere, usage, account deletion
- [x] Admin console: stats, user search, role changes, deletion, audit log

## Next

- [ ] Async generations: queue the job, return `202`, update the UI on completion
- [ ] Cost alerts when a day's estimated spend crosses a threshold
- [ ] Signed, expiring Cloudinary URLs for stored results
- [ ] Email verification and password reset by email
- [ ] Custom prompt add-ons per generation (length-limited, validated)
- [ ] Batch generation: one photo across several templates in one request
- [ ] Playwright end-to-end smoke test in CI
