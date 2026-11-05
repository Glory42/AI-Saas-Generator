import { z } from "zod";
import { apiRequest, type QueryRequestOptions } from "@/lib/api-client";
import { userSchema, type User } from "@/types/api";

const userResponseSchema = z.object({ user: userSchema });
const sessionResponseSchema = z.object({ user: userSchema.nullable() });

export type LoginInput = { email: string; password: string };
export type RegisterInput = LoginInput & { username: string };

export const getSession = async ({ signal }: QueryRequestOptions = {}): Promise<User | null> => {
  const data = await apiRequest<unknown>("/api/auth/session", { signal });
  return sessionResponseSchema.parse(data).user;
};

export const login = async (input: LoginInput): Promise<User> => {
  const data = await apiRequest<unknown, LoginInput>("/api/auth/login", {
    method: "POST",
    body: input,
  });
  return userResponseSchema.parse(data).user;
};

export const register = async (input: RegisterInput): Promise<User> => {
  const data = await apiRequest<unknown, RegisterInput>("/api/auth/register", {
    method: "POST",
    body: input,
  });
  return userResponseSchema.parse(data).user;
};

export const logout = async (): Promise<void> => {
  await apiRequest("/api/auth/logout", { method: "POST" });
};

export const logoutAll = async (): Promise<void> => {
  await apiRequest("/api/auth/logout-all", { method: "POST" });
};
