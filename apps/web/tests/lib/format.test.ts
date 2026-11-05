import { describe, expect, it } from "vitest";
import { formatNumber, formatRelativeHours, formatUsd } from "@/lib/format";

describe("formatUsd", () => {
  it("shows four decimals for sub-dollar amounts", () => {
    expect(formatUsd(0.039)).toBe("$0.0390");
    expect(formatUsd(0.0005)).toBe("$0.0005");
  });

  it("shows two decimals for zero and larger amounts", () => {
    expect(formatUsd(0)).toBe("$0.00");
    expect(formatUsd(12.5)).toBe("$12.50");
  });
});

describe("formatNumber", () => {
  it("groups thousands", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });
});

describe("formatRelativeHours", () => {
  const now = new Date("2026-11-05T12:00:00Z");

  it("rounds to whole hours", () => {
    expect(formatRelativeHours("2026-11-05T15:10:00Z", now)).toBe("in 3 hours");
    expect(formatRelativeHours("2026-11-05T13:00:00Z", now)).toBe("in 1 hour");
  });

  it("never goes negative", () => {
    expect(formatRelativeHours("2026-11-05T11:00:00Z", now)).toBe("within the hour");
  });
});
