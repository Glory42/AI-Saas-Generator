import type { NextFunction, Request, Response } from "express";
import { isTrustedOrigin } from "../../infrastructure/config/origins";
import { AppError } from "../errors/app-error";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Cookies ride along on cross-site requests, so mutations must come from a known origin.
export const requireTrustedOrigin = (req: Request, _res: Response, next: NextFunction): void => {
  const origin = req.get("origin");
  if (SAFE_METHODS.has(req.method) || !origin || isTrustedOrigin(origin)) {
    next();
    return;
  }

  next(new AppError(403, "CORS_NOT_ALLOWED", "Origin is not allowed"));
};
