export const parseCookie = (cookieHeader: string | string[] | undefined, name: string): string | null => {
  if (!cookieHeader) return null;

  const header = Array.isArray(cookieHeader) ? cookieHeader.join("; ") : cookieHeader;

  // The last occurrence wins, matching browser cookie-jar precedence.
  let value: string | null = null;
  for (const part of header.split(";")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex <= 0) continue;

    if (part.slice(0, separatorIndex).trim() === name) {
      const raw = part.slice(separatorIndex + 1).trim();
      try {
        value = decodeURIComponent(raw);
      } catch {
        value = raw;
      }
    }
  }

  return value;
};
