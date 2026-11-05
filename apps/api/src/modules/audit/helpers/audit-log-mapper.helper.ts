import type { AuditLogListRow } from "../types/audit.types";

export const toAuditLogResponse = (row: AuditLogListRow) => ({
  id: row.id,
  actorId: row.actorId,
  actorEmail: row.actorEmail,
  action: row.action,
  metadata: row.metadata,
  ipAddress: row.ipAddress,
  createdAt: row.createdAt.toISOString(),
});
