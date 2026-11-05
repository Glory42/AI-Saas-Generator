import type { Request } from "express";
import { UnauthorizedError } from "../errors/app-error";
import type { AuthSession, AuthUser } from "../../types/auth";

export type ClientInfo = { ipAddress: string | null; userAgent: string | null };

export const getClientInfo = (req: Request): ClientInfo => ({
  ipAddress: req.ip ?? null,
  userAgent: req.get("user-agent")?.slice(0, 512) ?? null,
});

export const getAuth = (req: Request): { user: AuthUser; session: AuthSession } => {
  if (!req.user || !req.session) {
    throw new UnauthorizedError();
  }

  return { user: req.user, session: req.session };
};
