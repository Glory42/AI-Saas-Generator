# Sessions live in httpOnly cookies backed by a sessions table, not in localStorage

The first version returned a JWT and a refresh token in the login response body and the web app
kept both in `localStorage`, XOR-"encrypted" with a key that was itself stored in `localStorage`.
Any XSS could read them, the encryption added no protection, and logout depended on a separate
`token_blacklist` table that every authenticated request had to query.

We now issue two `httpOnly` cookies: a 15-minute JWT access token (HS256 via `jose`) carrying the
user id and a session id (`sid`), and an opaque 32-byte refresh token that is rotated on every
refresh and stored only as a SHA-256 hash in `sessions`. Revoking a session is a single
`revoked_at` update; the access-token check joins `sessions` in the same query that loads the user,
so the blacklist table is gone. Passwords are hashed with argon2id through `Bun.password`.

Because cookies are sent automatically, every mutation is also checked against an `Origin`
allow-list (the same list CORS uses), and cookies are `SameSite=Lax` in development and
`SameSite=None; Secure` in production, where the web app and API are on different hosts.

## Consequences

- The web app never sees a token; "am I signed in?" is `GET /api/auth/session`.
- Safari's ITP blocks third-party cookies, so production should serve the API from a subdomain of
  the web app's domain (e.g. `api.saas.gorkemkaryol.dev`) to keep cookies first-party.
- A rotated refresh token keeps authenticating requests for 20 seconds (`ROTATION_GRACE_MS`).
  Without it, a page that fires several requests right after the access cookie expires would see
  one request win the rotation and the rest fail with 401, signing the user out. The explicit
  `POST /api/auth/refresh` stays strict.
