import type { Request, Response } from "express";
import { getAuth, getClientInfo } from "../../commons/http/request-context";
import { parseInput } from "../../commons/validation/parse-input";
import { clearAuthCookies } from "../auth/helpers/auth-cookies.helper";
import { ChangePasswordSchema, DeleteAccountSchema, UpdateProfileSchema } from "./dto/users.dto";
import { toUserResponse } from "./helpers/user-mapper.helper";
import { UsersService } from "./users.service";

export class UsersController {
  // PATCH /api/users/me
  static async updateMe(req: Request, res: Response): Promise<void> {
    const { user } = getAuth(req);
    const input = parseInput(UpdateProfileSchema, req.body);

    const updated = await UsersService.updateProfile(user, input, getClientInfo(req));
    res.status(200).json({ user: toUserResponse(updated) });
  }

  // POST /api/users/me/password
  static async changePassword(req: Request, res: Response): Promise<void> {
    const { user, session } = getAuth(req);
    const input = parseInput(ChangePasswordSchema, req.body);

    await UsersService.changePassword(user, session.id, input, getClientInfo(req));
    res.status(200).json({ success: true });
  }

  // DELETE /api/users/me
  static async deleteMe(req: Request, res: Response): Promise<void> {
    const { user } = getAuth(req);
    const { currentPassword } = parseInput(DeleteAccountSchema, req.body);

    await UsersService.deleteAccount(user, currentPassword, getClientInfo(req));
    clearAuthCookies(res);
    res.status(204).end();
  }

  // GET /api/users/me/stats
  static async stats(req: Request, res: Response): Promise<void> {
    const { user } = getAuth(req);
    res.status(200).json({ stats: await UsersService.getStats(user) });
  }
}
