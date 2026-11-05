export type Cursor = { createdAt: Date; id: string };

export type Page<T> = { items: T[]; nextCursor: string | null };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const encodeCursor = (cursor: Cursor): string =>
  Buffer.from(`${cursor.createdAt.toISOString()}|${cursor.id}`, "utf8").toString("base64url");

// Returns null for anything malformed so a tampered cursor reads as "first page", not a 500.
export const decodeCursor = (value: string | undefined): Cursor | null => {
  if (!value) return null;

  const decoded = Buffer.from(value, "base64url").toString("utf8");
  const [timestamp, id, ...rest] = decoded.split("|");
  if (!timestamp || !id || rest.length > 0 || !UUID_PATTERN.test(id)) return null;

  const createdAt = new Date(timestamp);
  if (Number.isNaN(createdAt.getTime())) return null;

  return { createdAt, id };
};

// Callers fetch limit + 1 rows; the extra row only signals that another page exists.
export const toPage = <TRow extends Cursor, TItem>(
  rows: TRow[],
  limit: number,
  map: (row: TRow) => TItem,
): Page<TItem> => {
  const pageRows = rows.slice(0, limit);
  const last = pageRows.at(-1);

  return {
    items: pageRows.map(map),
    nextCursor: rows.length > limit && last ? encodeCursor(last) : null,
  };
};
