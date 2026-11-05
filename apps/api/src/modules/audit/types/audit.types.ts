export type AuditLogListRow = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: Date;
};
