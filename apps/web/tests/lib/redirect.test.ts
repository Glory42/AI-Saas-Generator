import { describe, expect, it } from "vitest";
import { getSafeRedirectPath, normalizeInternalRedirectPath } from "@/lib/router/redirect";

describe("normalizeInternalRedirectPath", () => {
  it.each([
    ["/gallery", "/gallery"],
    ["/admin?page=2&search=bob", "/admin?page=2&search=bob"],
    ["/gallery/abc#top", "/gallery/abc#top"],
    ["  /studio  ", "/studio"],
  ])("keeps internal path %s", (input, expected) => {
    expect(normalizeInternalRedirectPath(input)).toBe(expected);
  });

  it.each([
    "https://evil.example/phish",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "gallery",
    "",
    undefined,
    42,
  ])("rejects %s", (input) => {
    expect(normalizeInternalRedirectPath(input)).toBeNull();
  });
});

describe("getSafeRedirectPath", () => {
  it("uses the fallback for unsafe values", () => {
    expect(getSafeRedirectPath("https://evil.example", "/studio")).toBe("/studio");
  });

  it("passes safe values through", () => {
    expect(getSafeRedirectPath("/settings", "/studio")).toBe("/settings");
  });
});
