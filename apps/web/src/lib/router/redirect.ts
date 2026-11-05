const PLACEHOLDER_ORIGIN = "http://app.local";

// Only same-origin, absolute paths are allowed so ?redirect= can't bounce users off-site.
export const normalizeInternalRedirectPath = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) return null;

  try {
    const parsed = new URL(trimmed, PLACEHOLDER_ORIGIN);
    if (parsed.origin !== PLACEHOLDER_ORIGIN) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
};

export const getSafeRedirectPath = (value: unknown, fallbackPath = "/"): string =>
  normalizeInternalRedirectPath(value) ?? fallbackPath;
