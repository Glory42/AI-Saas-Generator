import type { NextFunction, Request, Response } from "express";
import { readAuthCookies, setAuthCookies } from "../../modules/auth/helpers/auth-cookies.helper";
import { SessionService } from "../../modules/auth/services/session.service";
import { UnauthorizedError } from "../errors/app-error";
import { getClientInfo } from "../http/request-context";

const resolve = async (req: Request, res: Response): Promise<boolean> => {
  const resolved = await SessionService.authenticate(readAuthCookies(req), getClientInfo(req));
  if (!resolved) return false;

  if (resolved.rotated) setAuthCookies(res, resolved.rotated);
  req.user = resolved.user;
  req.session = resolved.session;
  return true;
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  resolve(req, res)
    .then((authenticated) => next(authenticated ? undefined : new UnauthorizedError()))
    .catch(next);
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  resolve(req, res)
    .then(() => next())
    .catch(next);
};
