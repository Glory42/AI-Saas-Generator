import type { Cursor } from "../../commons/helpers/cursor.helper";
import { logger } from "../../commons/utils/logger";
import type { AuditAction } from "./constants/audit-actions.constants";
import { AuditRepository } from "./repositories/audit.repository";

export type AuditEntry = {
  actorId: string | null;
  action: AuditAction;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
};

export class AuditService {
  // Fire-and-forget: auditing must never fail or slow down the request that triggered it.
  static record(entry: AuditEntry): void {
    AuditRepository.insert({
      actorId: entry.actorId,
      action: entry.action,
      metadata: entry.metadata ?? {},
      ipAddress: entry.ipAddress ?? null,
    }).catch((error: unknown) => {
      logger.warn({ err: error, action: entry.action }, "Failed to write audit log");
    });
  }

  static listPage(limit: number, cursor: Cursor | null) {
    return AuditRepository.listPage(limit, cursor);
  }
}
