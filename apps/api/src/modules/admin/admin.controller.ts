import type { Request, Response } from "express";
import { getAuth, getClientInfo } from "../../commons/http/request-context";
import { CursorQuerySchema, IdParamsSchema } from "../../commons/validation/common.schemas";
import { parseInput } from "../../commons/validation/parse-input";
import { toUserResponse } from "../users/helpers/user-mapper.helper";
import { AdminService } from "./admin.service";
import { AdminUsersQuerySchema, UpdateRoleSchema } from "./dto/admin.dto";

export class AdminController {
  // GET /api/admin/stats
  static async stats(_req: Request, res: Response): Promise<void> {
    res.status(200).json({ stats: await AdminService.getStats() });
  }

  // GET /api/admin/users
  static async listUsers(req: Request, res: Response): Promise<void> {
    const query = parseInput(AdminUsersQuerySchema, req.query);
    res.status(200).json(await AdminService.listUsers(query));
  }

  // PATCH /api/admin/users/:id/role
  static async changeRole(req: Request, res: Response): Promise<void> {
    const { user } = getAuth(req);
    const { id } = parseInput(IdParamsSchema, req.params);
    const { role } = parseInput(UpdateRoleSchema, req.body);

    const updated = await AdminService.changeRole(user, id, role, getClientInfo(req));
    res.status(200).json({ user: toUserResponse(updated) });
  }

  // DELETE /api/admin/users/:id
  static async deleteUser(req: Request, res: Response): Promise<void> {
    const { user } = getAuth(req);
    const { id } = parseInput(IdParamsSchema, req.params);

    await AdminService.deleteUser(user, id, getClientInfo(req));
    res.status(204).end();
  }

  // GET /api/admin/audit-logs
  static async auditLogs(req: Request, res: Response): Promise<void> {
    const { limit, cursor } = parseInput(CursorQuerySchema, req.query);
    res.status(200).json(await AdminService.listAuditLogs(limit, cursor));
  }
}
