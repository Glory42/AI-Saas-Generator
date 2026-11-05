import rateLimit from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const tooManyRequests = (message: string) => ({ error: { message, code: "TOO_MANY_REQUESTS" } });

export const createApiLimiter = (limit = 300) =>
  rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: tooManyRequests("Too many requests, please slow down."),
  });

export const createCredentialLimiter = (limit = 30) =>
  rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: tooManyRequests("Too many sign-in attempts, please try again later."),
  });
