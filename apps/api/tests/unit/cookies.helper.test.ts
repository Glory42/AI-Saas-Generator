import { describe, expect, test } from "bun:test";
import { parseCookie } from "../../src/commons/helpers/cookies.helper";

describe("parseCookie", () => {
  test("finds a cookie among others", () => {
    expect(parseCookie("a=1; aisg_access=token; b=2", "aisg_access")).toBe("token");
  });

  test("returns null when missing", () => {
    expect(parseCookie("a=1", "aisg_access")).toBeNull();
    expect(parseCookie(undefined, "aisg_access")).toBeNull();
  });

  test("decodes values and keeps the last duplicate", () => {
    expect(parseCookie("x=first; x=hello%20world", "x")).toBe("hello world");
  });

  test("keeps undecodable values as-is", () => {
    expect(parseCookie("x=%E0%A4%A", "x")).toBe("%E0%A4%A");
  });
});
