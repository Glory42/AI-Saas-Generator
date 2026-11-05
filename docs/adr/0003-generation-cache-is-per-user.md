# The generation cache is keyed by content hash and scoped to the user

Re-running the same photo with the same template is common (users click "generate" twice, or
re-upload the same file), and every image call costs real money. The first version hashed a
512 px JPEG of the input plus the prompt and looked the hash up across **all** users' rows.

We keep content-addressed caching but scope it to the requesting user. The key is
`sha256(contentHash, templateId, promptVersion, modelTier)`, where `contentHash` is the hash of the
normalized upload. A hit inserts a new Generation with `cached = true`, `costUsd = 0` and the
earlier Generation's `resultUrl`/`resultStorageKey`.

We rejected a global cache: it hands one user a file stored under another user's prefix, and
deleting the first user's Image would break the second user's result. Bumping a Template's
`promptVersion` invalidates its cache entries without a migration.

## Consequences

- Deleting an Image only removes a result file when no other Generation references its storage
  key.
- Cache hits still count against the daily quota, so the cache cannot be used to bypass it.
