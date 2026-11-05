// Run each app's own scripts from its directory so ESLint resolves its config's file globs correctly.
export default {
  "apps/api/**/*.ts": () => ["bun run --cwd apps/api lint", "bun run --cwd apps/api lint:arch"],
  "apps/web/**/*.{ts,tsx}": () => ["bun run --cwd apps/web lint"],
};
