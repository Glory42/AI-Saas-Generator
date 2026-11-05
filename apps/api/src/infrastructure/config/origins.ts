import { env } from "./env";

const normalizeOrigin = (origin: string): string => origin.trim().replace(/\/+$/, "").toLowerCase();

export const trustedOrigins: ReadonlySet<string> = new Set(
  env.CORS_ORIGIN.split(",").map(normalizeOrigin).filter((origin) => origin.length > 0),
);

export const isTrustedOrigin = (origin: string): boolean => trustedOrigins.has(normalizeOrigin(origin));
