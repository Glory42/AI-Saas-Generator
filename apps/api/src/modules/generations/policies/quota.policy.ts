import type { Role } from "../../../types/auth";

export const QUOTA_WINDOW_MS = 24 * 60 * 60 * 1000;

export type QuotaInput = {
  role: Role;
  limit: number;
  usedInWindow: number;
  // Oldest counted generation in the window; its expiry frees the next slot.
  oldestInWindow: Date | null;
  now: Date;
};

export type QuotaStatus = {
  allowed: boolean;
  limit: number | null;
  used: number;
  resetsAt: Date;
};

export const windowStart = (now: Date): Date => new Date(now.getTime() - QUOTA_WINDOW_MS);

export const evaluateQuota = (input: QuotaInput): QuotaStatus => {
  const resetsAt = new Date((input.oldestInWindow ?? input.now).getTime() + QUOTA_WINDOW_MS);

  if (input.role === "admin") {
    return { allowed: true, limit: null, used: input.usedInWindow, resetsAt };
  }

  return {
    allowed: input.usedInWindow < input.limit,
    limit: input.limit,
    used: input.usedInWindow,
    resetsAt,
  };
};
