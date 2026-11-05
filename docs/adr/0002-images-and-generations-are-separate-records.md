# An Image has many Generations

The first version stored one row per upload in `images`, with `generated_url`, `template`,
`cost_usd` and `model_tier` columns that the generate endpoint overwrote. Generating the same photo
with a second template silently replaced the first result, failed attempts left no trace, and
per-template stats were impossible.

We split it in two: `images` is the uploaded photo (storage key, dimensions, content hash) and
`generations` is one attempt to render it with a Template (status, strategy, cost, result). A
Generation row is written as `pending` before the AI call and updated to `completed` or `failed`
after, so failures are counted, stats come from SQL aggregates, and the gallery can show every
style a photo was rendered in.

## Consequences

- `POST /api/images/:id/generations` replaces `POST /api/generate`.
- Usage stats and quotas are computed from `generations`; no counters to keep in sync.
