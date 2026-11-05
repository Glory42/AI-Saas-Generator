import { BadRequestError, NotFoundError } from "../../commons/errors/app-error";
import { decodeCursor, toPage } from "../../commons/helpers/cursor.helper";
import type { ClientInfo } from "../../commons/http/request-context";
import type { AuthUser, Role } from "../../types/auth";
import { AuditService } from "../audit/audit.service";
import { AUDIT_ACTIONS } from "../audit/constants/audit-actions.constants";
import { toAuditLogResponse } from "../audit/helpers/audit-log-mapper.helper";
import { windowStart } from "../generations/policies/quota.policy";
import { toAuthUser } from "../users/helpers/user-mapper.helper";
import { UsersService } from "../users/users.service";
import type { AdminUsersQuery } from "./dto/admin.dto";
import { toAdminUserResponse } from "./helpers/admin-user-mapper.helper";
import { AdminRepository } from "./repositories/admin.repository";

// An admin locking themselves out (or deleting themselves) needs another admin to undo.
const assertNotSelf = (actor: AuthUser, targetId: string, action: string): void => {
  if (actor.id === targetId) throw new BadRequestError(`You cannot ${action} your own account`);
};

export class AdminService {
  static async getStats() {
    const [userCounts, totalImages, generations] = await Promise.all([
      AdminRepository.userCounts(),
      AdminRepository.imageCount(),
      AdminRepository.generationTotals(windowStart(new Date())),
    ]);

    return {
      totalUsers: userCounts.total,
      adminUsers: userCounts.admins,
      totalImages,
      totalGenerations: generations.total,
      cachedGenerations: generations.cached,
      failedGenerations: generations.failed,
      generationsLast24h: generations.recent,
      totalCostUsd: generations.costUsd,
    };
  }

  static async listUsers(query: AdminUsersQuery) {
    const { rows, total } = await AdminRepository.usersPage(query.page, query.pageSize, query.search || undefined);
    const usage = await AdminRepository.usageFor(rows.map((row) => row.id));

    return {
      items: rows.map((row) => toAdminUserResponse(row, usage.get(row.id))),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  static async changeRole(actor: AuthUser, targetId: string, role: Role, client: ClientInfo): Promise<AuthUser> {
    assertNotSelf(actor, targetId, "change the role of");

    const previous = await AdminRepository.findUser(targetId);
    if (!previous) throw new NotFoundError("User not found");

    const updated = await AdminRepository.updateRole(targetId, role);
    if (!updated) throw new NotFoundError("User not found");

    AuditService.record({
      actorId: actor.id,
      action: AUDIT_ACTIONS.adminRoleChanged,
      metadata: { targetUserId: targetId, previousRole: previous.role, newRole: role },
      ipAddress: client.ipAddress,
    });
    return toAuthUser(updated);
  }

  static async deleteUser(actor: AuthUser, targetId: string, client: ClientInfo): Promise<void> {
    assertNotSelf(actor, targetId, "delete");

    const target = await AdminRepository.findUser(targetId);
    if (!target) throw new NotFoundError("User not found");

    await UsersService.deleteWithFiles(targetId);
    AuditService.record({
      actorId: actor.id,
      action: AUDIT_ACTIONS.adminUserDeleted,
      metadata: { targetUserId: targetId, targetEmail: target.email },
      ipAddress: client.ipAddress,
    });
  }

  static async listAuditLogs(limit: number, cursor: string | undefined) {
    const rows = await AuditService.listPage(limit, decodeCursor(cursor));
    return toPage(rows, limit, toAuditLogResponse);
  }
}
