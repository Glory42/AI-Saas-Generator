import { describe, expect, test } from "bun:test";
import { decodeCursor, encodeCursor, toPage } from "../../src/commons/helpers/cursor.helper";

const row = (minute: number, id: string) => ({ createdAt: new Date(Date.UTC(2026, 10, 5, 12, minute)), id });
const ids = ["0a1b2c3d-1111-4222-8333-444455556666", "0a1b2c3d-1111-4222-8333-444455556667", "0a1b2c3d-1111-4222-8333-444455556668"] as const;

describe("cursor helper", () => {
  test("round-trips createdAt and id", () => {
    const cursor = row(1, ids[0]);
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  test.each(["", "garbage", Buffer.from("not-a-date|abc").toString("base64url"), Buffer.from("2026-01-01T00:00:00Z|x|y").toString("base64url")])(
    "treats a malformed cursor (%p) as the first page",
    (value) => {
      expect(decodeCursor(value)).toBeNull();
    },
  );

  test("toPage trims the look-ahead row and emits a cursor for the last item", () => {
    const rows = ids.map((id, index) => row(10 - index, id));
    const page = toPage(rows, 2, (item) => item.id);

    expect(page.items).toEqual([ids[0], ids[1]]);
    expect(page.nextCursor).not.toBeNull();
    expect(decodeCursor(page.nextCursor ?? "")?.id).toBe(ids[1]);
  });

  test("toPage returns no cursor on the last page", () => {
    expect(toPage([row(1, ids[0])], 2, (item) => item.id).nextCursor).toBeNull();
  });
});
