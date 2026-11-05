import type { ClientInfo } from "../../../commons/http/request-context";
import { env } from "../../../infrastructure/config/env";
import type { AuthUser } from "../../../types/auth";
import { toAuthUser } from "../../users/helpers/user-mapper.helper";
import { UsersRepository } from "../../users/repositories/users.repository";
import { SessionsRepository } from "../repositories/sessions.repository";
import type { IssuedSession, ResolvedAuth } from "../types/auth.types";
import { TokenService } from "./token.service";

// How long a just-rotated refresh token still authenticates requests that were already in flight.
const ROTATION_GRACE_MS = 20_000;

const refreshExpiry = (): Date => new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);

const issueAccess = async (user: AuthUser, sessionId: string, refreshToken: string, refreshTokenExpiresAt: Date) => {
  const access = await TokenService.signAccessToken({ userId: user.id, sessionId, role: user.role });

  return {
    sessionId,
    accessToken: access.token,
    accessTokenExpiresAt: access.expiresAt,
    refreshToken,
    refreshTokenExpiresAt,
  } satisfies IssuedSession;
};

export class SessionService {
  static async create(user: AuthUser, client: ClientInfo): Promise<IssuedSession> {
    const refreshToken = TokenService.generateRefreshToken();
    const expiresAt = refreshExpiry();
    const session = await SessionsRepository.insert({
      userId: user.id,
      refreshTokenHash: TokenService.hashRefreshToken(refreshToken),
      expiresAt,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    });

    return issueAccess(user, session.id, refreshToken, expiresAt);
  }

  static async resolveAccessToken(accessToken: string): Promise<ResolvedAuth | null> {
    const claims = await TokenService.verifyAccessToken(accessToken);
    if (!claims) return null;

    const context = await SessionsRepository.findActiveWithUser(claims.sessionId);
    if (!context || context.user.id !== claims.userId) return null;

    // Role comes from the database, not the token, so demotions apply immediately.
    return { user: toAuthUser(context.user), session: { id: context.sessionId } };
  }

  static async rotate(refreshToken: string, client: ClientInfo): Promise<(ResolvedAuth & { rotated: IssuedSession }) | null> {
    const nextRefreshToken = TokenService.generateRefreshToken();
    const expiresAt = refreshExpiry();
    const session = await SessionsRepository.rotate(TokenService.hashRefreshToken(refreshToken), {
      refreshTokenHash: TokenService.hashRefreshToken(nextRefreshToken),
      expiresAt,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    });
    if (!session) return null;

    const userRow = await UsersRepository.findById(session.userId);
    if (!userRow) return null;

    const user = toAuthUser(userRow);
    const rotated = await issueAccess(user, session.id, nextRefreshToken, expiresAt);
    return { user, session: { id: session.id }, rotated };
  }

  static async authenticate(
    tokens: { accessToken: string | null; refreshToken: string | null },
    client: ClientInfo,
  ): Promise<ResolvedAuth | null> {
    if (tokens.accessToken) {
      const resolved = await SessionService.resolveAccessToken(tokens.accessToken);
      if (resolved) return resolved;
    }

    // Expired or missing access token: refresh transparently so idle tabs stay signed in.
    if (!tokens.refreshToken) return null;
    return (
      (await SessionService.rotate(tokens.refreshToken, client)) ??
      SessionService.resolveRecentlyRotated(tokens.refreshToken)
    );
  }

  // The request that won the rotation already set the new cookies; the others just need to pass.
  private static async resolveRecentlyRotated(refreshToken: string): Promise<ResolvedAuth | null> {
    const context = await SessionsRepository.findRecentlyRotatedWithUser(
      TokenService.hashRefreshToken(refreshToken),
      new Date(Date.now() - ROTATION_GRACE_MS),
    );
    return context ? { user: toAuthUser(context.user), session: { id: context.sessionId } } : null;
  }

  static revokeByRefreshToken(refreshToken: string): Promise<string | null> {
    return SessionsRepository.revokeByRefreshHash(TokenService.hashRefreshToken(refreshToken));
  }

  static revoke(sessionId: string): Promise<void> {
    return SessionsRepository.revokeById(sessionId);
  }

  static revokeAll(userId: string, exceptSessionId?: string): Promise<void> {
    return SessionsRepository.revokeAllForUser(userId, exceptSessionId);
  }
}
