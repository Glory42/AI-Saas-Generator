export const AUDIT_ACTIONS = {
  register: "auth.register",
  login: "auth.login",
  loginFailed: "auth.login_failed",
  loginBlocked: "auth.login_blocked",
  logout: "auth.logout",
  logoutAll: "auth.logout_all",
  profileUpdated: "user.profile_updated",
  passwordChanged: "user.password_changed",
  accountDeleted: "user.account_deleted",
  imageUploaded: "image.uploaded",
  imageDeleted: "image.deleted",
  imageGenerated: "image.generated",
  imageGenerationFailed: "image.generation_failed",
  adminRoleChanged: "admin.user.role_changed",
  adminUserDeleted: "admin.user.deleted",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
