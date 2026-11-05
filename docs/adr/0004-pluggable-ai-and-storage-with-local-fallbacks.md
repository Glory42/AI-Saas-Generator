# AI and storage are behind small interfaces with local fallbacks

Running the first version required a Supabase project, a Cloudinary account and a Gemini key, and
the server called the paid image model on every boot to "validate" the key. Tests could not run
without hitting all three.

`infrastructure/ai` exposes a `GenerationStrategy` interface (`generate(input) → { buffer,
mimeType, strategy, costUsd }`) and builds an ordered chain from config: `gemini-image` →
`hybrid` when `GEMINI_API_KEY` is set, otherwise `local-preview`, which applies a deterministic
`sharp` filter per template. `infrastructure/storage` exposes a `StorageProvider` (`put`, `read`,
`delete`, `publicUrl`) with a Cloudinary implementation and a local-disk one that serves files from
`/api/files/*`.

## Consequences

- `docker compose up -d postgres && bun run dev` gives a fully working app with no accounts.
- Integration tests exercise the real upload → generate → cache path with `local-preview` and
  local disk; no module mocking.
- Production refuses to start without `GEMINI_API_KEY` and Cloudinary credentials (env schema).
