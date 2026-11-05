import type { AuthUser } from "../../../types/auth";
import type { UserRow } from "../users.entity";

export const toAuthUser = (row: UserRow): AuthUser => ({
  id: row.id,
  email: row.email,
  username: row.username,
  role: row.role,
  createdAt: row.createdAt,
});

export const toUserResponse = (user: AuthUser) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
  createdAt: user.createdAt.toISOString(),
});

export type UserResponse = ReturnType<typeof toUserResponse>;
