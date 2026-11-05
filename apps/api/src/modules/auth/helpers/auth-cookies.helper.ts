import type { CookieOptions, Request, Response } from "express";
import { parseCookie } from "../../../commons/helpers/cookies.helper";
import { env } from "../../../infrastructure/config/env";
import type { IssuedSession } from "../types/auth.types";

const isProduction = env.NODE_ENV === "production";

// Production serves the web app and API from different hosts, which needs SameSite=None.
const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

export const setAuthCookies = (res: Response, session: IssuedSession): void => {
  res.cookie(env.AUTH_ACCESS_COOKIE_NAME, session.accessToken, {
    ...baseCookieOptions,
    expires: session.accessTokenExpiresAt,
  });
  res.cookie(env.AUTH_REFRESH_COOKIE_NAME, session.refreshToken, {
    ...baseCookieOptions,
    expires: session.refreshTokenExpiresAt,
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(env.AUTH_ACCESS_COOKIE_NAME, baseCookieOptions);
  res.clearCookie(env.AUTH_REFRESH_COOKIE_NAME, baseCookieOptions);
};

export const readAuthCookies = (req: Request): { accessToken: string | null; refreshToken: string | null } => ({
  accessToken: parseCookie(req.headers.cookie, env.AUTH_ACCESS_COOKIE_NAME),
  refreshToken: parseCookie(req.headers.cookie, env.AUTH_REFRESH_COOKIE_NAME),
});
