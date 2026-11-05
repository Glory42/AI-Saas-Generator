export const LOCKOUT_RULES = {
  emailMaxConsecutiveFailures: 5,
  emailWindowMs: 15 * 60 * 1000,
  emailLockMs: 15 * 60 * 1000,
  ipMaxFailures: 20,
  ipWindowMs: 60 * 60 * 1000,
} as const;

export type LoginAttempt = { succeeded: boolean; createdAt: Date };

export type LockoutInput = {
  // Newest first; only the first emailMaxConsecutiveFailures entries are considered.
  recentEmailAttempts: LoginAttempt[];
  ipFailuresInWindow: number;
  oldestIpFailureAt: Date | null;
  now: Date;
};

export type LockoutDecision =
  | { locked: false }
  | { locked: true; scope: "email" | "ip"; retryAfterSeconds: number };

const secondsUntil = (target: number, now: Date): number => Math.max(1, Math.ceil((target - now.getTime()) / 1000));

const evaluateEmail = (attempts: LoginAttempt[], now: Date): LockoutDecision => {
  const window = attempts.slice(0, LOCKOUT_RULES.emailMaxConsecutiveFailures);
  const newest = window[0];
  const oldest = window.at(-1);

  if (window.length < LOCKOUT_RULES.emailMaxConsecutiveFailures || !newest || !oldest) return { locked: false };
  if (window.some((attempt) => attempt.succeeded)) return { locked: false };
  if (newest.createdAt.getTime() - oldest.createdAt.getTime() > LOCKOUT_RULES.emailWindowMs) return { locked: false };

  const unlockAt = newest.createdAt.getTime() + LOCKOUT_RULES.emailLockMs;
  if (now.getTime() >= unlockAt) return { locked: false };

  return { locked: true, scope: "email", retryAfterSeconds: secondsUntil(unlockAt, now) };
};

const evaluateIp = (failures: number, oldest: Date | null, now: Date): LockoutDecision => {
  if (failures < LOCKOUT_RULES.ipMaxFailures || !oldest) return { locked: false };

  const unlockAt = oldest.getTime() + LOCKOUT_RULES.ipWindowMs;
  if (now.getTime() >= unlockAt) return { locked: false };

  return { locked: true, scope: "ip", retryAfterSeconds: secondsUntil(unlockAt, now) };
};

export const evaluateLockout = (input: LockoutInput): LockoutDecision => {
  const byEmail = evaluateEmail(input.recentEmailAttempts, input.now);
  if (byEmail.locked) return byEmail;

  return evaluateIp(input.ipFailuresInWindow, input.oldestIpFailureAt, input.now);
};
