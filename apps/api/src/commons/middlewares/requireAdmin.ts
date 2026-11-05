import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors/app-error";

// Must run after requireAuth, which loads the role from the database.
export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    next(new UnauthorizedError());
    return;
  }

  next(req.user.role === "admin" ? undefined : new ForbiddenError("Admin privileges required"));
};
