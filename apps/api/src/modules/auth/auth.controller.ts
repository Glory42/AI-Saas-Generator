import type { Request, Response } from "express";
import { getAuth, getClientInfo } from "../../commons/http/request-context";
import { parseInput } from "../../commons/validation/parse-input";
import { toAuthUser, toUserResponse } from "../users/helpers/user-mapper.helper";
import { AuthService } from "./auth.service";
import { LoginSchema, RegisterSchema } from "./dto/auth.dto";
import { clearAuthCookies, readAuthCookies, setAuthCookies } from "./helpers/auth-cookies.helper";

export class AuthController {
  // POST /api/auth/register
  static async register(req: Request, res: Response): Promise<void> {
    const input = parseInput(RegisterSchema, req.body);
    const { user, session } = await AuthService.register(input, getClientInfo(req));

    setAuthCookies(res, session);
    res.status(201).json({ user: toUserResponse(toAuthUser(user)) });
  }

  // POST /api/auth/login
  static async login(req: Request, res: Response): Promise<void> {
    const input = parseInput(LoginSchema, req.body);
    const { user, session } = await AuthService.login(input, getClientInfo(req));

    setAuthCookies(res, session);
    res.status(200).json({ user: toUserResponse(toAuthUser(user)) });
  }

  // POST /api/auth/refresh
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { user, rotated } = await AuthService.refresh(readAuthCookies(req).refreshToken, getClientInfo(req));
      setAuthCookies(res, rotated);
      res.status(200).json({ user: toUserResponse(user) });
    } catch (error) {
      clearAuthCookies(res);
      throw error;
    }
  }

  // POST /api/auth/logout
  static async logout(req: Request, res: Response): Promise<void> {
    await AuthService.logout(readAuthCookies(req), getClientInfo(req));
    clearAuthCookies(res);
    res.status(200).json({ success: true });
  }

  // POST /api/auth/logout-all
  static async logoutAll(req: Request, res: Response): Promise<void> {
    const { user } = getAuth(req);
    await AuthService.logoutAll(user.id, getClientInfo(req));
    clearAuthCookies(res);
    res.status(200).json({ success: true });
  }

  // GET /api/auth/session
  static async session(req: Request, res: Response): Promise<void> {
    res.status(200).json({ user: req.user ? toUserResponse(req.user) : null });
  }
}
