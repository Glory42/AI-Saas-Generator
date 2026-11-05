# syntax=docker/dockerfile:1

FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM base AS prod
COPY . .
ENV NODE_ENV=production
EXPOSE 5000
# Migrations are idempotent, so every deploy applies whatever is pending before serving traffic.
CMD ["sh", "-c", "bun run scripts/migrate.ts && exec bun run src/index.ts"]
