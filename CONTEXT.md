# AI SaaS Generator

AI SaaS Generator turns ordinary product photos into marketing-ready shots. Users upload a photo,
pick a style, and get an AI-generated result they can download and revisit in their gallery.

## Language

### Identity

**User**:
An account that can sign in, upload Images and request Generations. Has a `role` of `user` or
`admin`. Stored in `users`.
_Avoid_: account, member, customer

**Session**:
One signed-in device. Backed by a row in `sessions` holding the hashed refresh token; the JWT
access token carries the session id (`sid`) so revoking the row ends the session everywhere.
_Avoid_: token, login

**Admin**:
A User with `role = "admin"`. Admins have no generation quota and can manage other Users. An admin
cannot change their own role or delete themselves.

### Studio

**Image**:
A photo a User uploaded. Normalized on upload (EXIF-rotated, metadata stripped, re-encoded to
WebP) and identified by the SHA-256 **content hash** of the normalized bytes. One Image has many
Generations.
_Avoid_: upload, photo, original (as a noun)

**Template**:
A named style (`ecommerce-clean`, `instagram-promo`, `lifestyle-outdoor`, …) that holds the
system prompt and the **model tier** used to render it. Templates live in code
(`modules/templates/constants`), not the database; their prompts are never sent to clients.
_Avoid_: style, preset, prompt

**Model tier**:
`flash` (fast and cheap) or `pro` (higher quality, roughly 3× the cost). Set per Template; picks
which image model the `gemini-image` strategy calls.

**Generation**:
One attempt to render an Image with a Template. Has a `status` (`pending` → `completed` |
`failed`), the strategy that produced it, an estimated `costUsd`, and a `resultUrl` when
completed. Failed Generations are kept so failures are visible in stats.
_Avoid_: result, render, output, job

**Strategy**:
One way of producing a Generation: `gemini-image` (direct image-to-image), `hybrid` (Gemini writes
a detailed prompt, an external text-to-image renderer draws it), `local-preview` (a deterministic
`sharp` filter used when no AI key is configured) or `cache`. Strategies are tried in order until
one succeeds.

**Cache hit**:
A Generation served from an earlier completed Generation by the same User with the same cache key
(content hash + Template id + prompt version + model tier). Costs nothing, still counts against
the quota, and points at the original result file. See ADR 0003.

**Quota**:
The number of Generations a non-admin User may create per rolling 24 hours
(`GENERATION_DAILY_LIMIT`, default 20). Stored nowhere: counted from `generations`.

### Operations

**Audit log**:
An append-only record of security- and money-relevant actions (`auth.login_failed`,
`image.generated`, `admin.user.role_changed`, …) with actor, IP and metadata. Written
fire-and-forget; a failed audit write never fails the request.

**Lockout**:
Temporary refusal of logins for an email (five consecutive failures in 15 minutes) or an IP
(twenty failures in an hour). Derived from `login_attempts`, not stored as its own state.

## Relationships

- A **User** has many **Sessions**, **Images** and **Generations**.
- An **Image** has many **Generations**; deleting an Image deletes its Generations and any stored
  result file no other Generation still points at.
- A **Generation** references exactly one **Template** by id and records the **Strategy** that
  produced it.
- A **Cache hit** is a **Generation** whose result file belongs to an earlier **Generation**.
