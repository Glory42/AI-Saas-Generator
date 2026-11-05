export type Role = "user" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: Role;
  createdAt: Date;
};

export type AuthSession = { id: string };
