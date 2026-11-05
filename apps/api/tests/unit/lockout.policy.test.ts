import { describe, expect, test } from "bun:test";
import { evaluateLockout, LOCKOUT_RULES, type LoginAttempt } from "../../src/modules/auth/policies/lockout.policy";

const now = new Date("2026-11-05T12:00:00Z");
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60_000);
const failures = (count: number, startMinutesAgo = 1): LoginAttempt[] =>
  Array.from({ length: count }, (_, index) => ({ succeeded: false, createdAt: minutesAgo(startMinutesAgo + index) }));

const evaluate = (recentEmailAttempts: LoginAttempt[], ipFailuresInWindow = 0, oldestIpFailureAt: Date | null = null) =>
  evaluateLockout({ recentEmailAttempts, ipFailuresInWindow, oldestIpFailureAt, now });

describe("evaluateLockout", () => {
  test("allows logins below the consecutive-failure threshold", () => {
    expect(evaluate(failures(LOCKOUT_RULES.emailMaxConsecutiveFailures - 1))).toEqual({ locked: false });
  });

  test("locks the email after five consecutive failures within 15 minutes", () => {
    const decision = evaluate(failures(5));
    expect(decision).toEqual({ locked: true, scope: "email", retryAfterSeconds: 14 * 60 });
  });

  test("a success inside the window resets the streak", () => {
    const attempts = failures(5);
    attempts[2] = { succeeded: true, createdAt: minutesAgo(3) };
    expect(evaluate(attempts)).toEqual({ locked: false });
  });

  test("failures spread over more than 15 minutes do not lock", () => {
    const spread = [1, 5, 9, 13, 20].map((minutes) => ({ succeeded: false, createdAt: minutesAgo(minutes) }));
    expect(evaluate(spread)).toEqual({ locked: false });
  });

  test("the lock expires 15 minutes after the newest failure", () => {
    expect(evaluate(failures(5, 16))).toEqual({ locked: false });
  });

  test("locks the IP after twenty failures within an hour", () => {
    const decision = evaluate([], LOCKOUT_RULES.ipMaxFailures, minutesAgo(30));
    expect(decision).toEqual({ locked: true, scope: "ip", retryAfterSeconds: 30 * 60 });
  });
});
