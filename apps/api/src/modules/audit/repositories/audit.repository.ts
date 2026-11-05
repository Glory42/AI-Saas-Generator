import { and, desc, eq, lt, or } from "drizzle-orm";
import type { Cursor } from "../../../commons/helpers/cursor.helper";
import { db } from "../../../infrastructure/database/db";
import { users } from "../../users/users.entity";
import { auditLogs, type AuditLogInsert } from "../audit.entity";
import type { AuditLogListRow } from "../types/audit.types";

export class AuditRepository {
  static async insert(row: AuditLogInsert): Promise<void> {
    await db.insert(auditLogs).values(row);
  }

  static async listPage(limit: number, cursor: Cursor | null): Promise<AuditLogListRow[]> {
    return db
      .select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        actorEmail: users.email,
        action: auditLogs.action,
        metadata: auditLogs.metadata,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorId))
      .where(
        cursor
          ? or(
              lt(auditLogs.createdAt, cursor.createdAt),
              and(eq(auditLogs.createdAt, cursor.createdAt), lt(auditLogs.id, cursor.id)),
            )
          : undefined,
      )
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(limit + 1);
  }
}
