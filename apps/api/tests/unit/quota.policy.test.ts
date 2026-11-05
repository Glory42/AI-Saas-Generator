import { describe, expect, test } from "bun:test";
import { evaluateQuota, QUOTA_WINDOW_MS, windowStart } from "../../src/modules/generations/policies/quota.policy";

const now = new Date("2026-11-05T12:00:00Z");

describe("evaluateQuota", () => {
  test("allows users under the limit", () => {
    const status = evaluateQuota({ role: "user", limit: 20, usedInWindow: 19, oldestInWindow: now, now });
    expect(status.allowed).toBe(true);
    expect(status.limit).toBe(20);
  });

  test("blocks users at the limit and resets when the oldest generation leaves the window", () => {
    const oldest = new Date(now.getTime() - 60 * 60 * 1000);
    const status = evaluateQuota({ role: "user", limit: 20, usedInWindow: 20, oldestInWindow: oldest, now });
    expect(status.allowed).toBe(false);
    expect(status.resetsAt).toEqual(new Date(oldest.getTime() + QUOTA_WINDOW_MS));
  });

  test("admins are unlimited", () => {
    const status = evaluateQuota({ role: "admin", limit: 20, usedInWindow: 500, oldestInWindow: now, now });
    expect(status).toMatchObject({ allowed: true, limit: null, used: 500 });
  });

  test("windowStart is 24 hours back", () => {
    expect(now.getTime() - windowStart(now).getTime()).toBe(24 * 60 * 60 * 1000);
  });
});
