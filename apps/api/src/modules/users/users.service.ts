import { BadRequestError, ConflictError, NotFoundError } from "../../commons/errors/app-error";
import type { ClientInfo } from "../../commons/http/request-context";
import type { AuthUser } from "../../types/auth";
import { AuditService } from "../audit/audit.service";
import { AUDIT_ACTIONS } from "../audit/constants/audit-actions.constants";
import { PasswordService } from "../auth/services/password.service";
import { SessionService } from "../auth/services/session.service";
import { GenerationsService } from "../generations/generations.service";
import { ImagesService } from "../images/images.service";
import type { ChangePasswordInput, UpdateProfileInput } from "./dto/users.dto";
import { toAuthUser } from "./helpers/user-mapper.helper";
import { UserStatsRepository } from "./repositories/user-stats.repository";
import { isUniqueViolation, UsersRepository } from "./repositories/users.repository";

const assertCurrentPassword = async (userId: string, currentPassword: string): Promise<void> => {
  const user = await UsersRepository.findById(userId);
  if (!user) throw new NotFoundError("User not found");
  // 400 rather than 401: the session is fine, only the confirmation is wrong.
  if (!(await PasswordService.verify(currentPassword, user.passwordHash))) {
    throw new BadRequestError("Current password is incorrect");
  }
};

export class UsersService {
  static async updateProfile(user: AuthUser, input: UpdateProfileInput, client: ClientInfo): Promise<AuthUser> {
    let updated;
    try {
      updated = await UsersRepository.update(user.id, input);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError("An account with this email already exists");
      throw error;
    }
    if (!updated) throw new NotFoundError("User not found");

    AuditService.record({
      actorId: user.id,
      action: AUDIT_ACTIONS.profileUpdated,
      metadata: { fields: Object.keys(input) },
      ipAddress: client.ipAddress,
    });
    return toAuthUser(updated);
  }

  static async changePassword(user: AuthUser, sessionId: string, input: ChangePasswordInput, client: ClientInfo) {
    await assertCurrentPassword(user.id, input.currentPassword);

    await UsersRepository.update(user.id, { passwordHash: await PasswordService.hash(input.newPassword) });
    await SessionService.revokeAll(user.id, sessionId);

    AuditService.record({ actorId: user.id, action: AUDIT_ACTIONS.passwordChanged, ipAddress: client.ipAddress });
  }

  static async deleteAccount(user: AuthUser, currentPassword: string, client: ClientInfo): Promise<void> {
    await assertCurrentPassword(user.id, currentPassword);
    await UsersService.deleteWithFiles(user.id);

    AuditService.record({
      actorId: null,
      action: AUDIT_ACTIONS.accountDeleted,
      metadata: { userId: user.id, email: user.email },
      ipAddress: client.ipAddress,
    });
  }

  // Shared with admin deletion: rows cascade, stored files need an explicit cleanup.
  static async deleteWithFiles(userId: string): Promise<boolean> {
    const keys = await ImagesService.collectUserFiles(userId);
    const deleted = await UsersRepository.delete(userId);
    if (deleted) await ImagesService.deleteFiles(keys);
    return deleted;
  }

  static async getStats(user: AuthUser) {
    const [totalImages, totals, mostUsedTemplateId, quota] = await Promise.all([
      UserStatsRepository.imageCount(user.id),
      UserStatsRepository.generationTotals(user.id),
      UserStatsRepository.mostUsedTemplateId(user.id),
      GenerationsService.getQuotaStatus(user),
    ]);

    return {
      totalImages,
      totalGenerations: totals.total,
      cachedGenerations: totals.cached,
      totalCostUsd: totals.costUsd,
      generationsByTier: { flash: totals.flash, pro: totals.pro },
      mostUsedTemplateId,
      quota: { limit: quota.limit, used: quota.used, resetsAt: quota.resetsAt.toISOString() },
    };
  }
}
