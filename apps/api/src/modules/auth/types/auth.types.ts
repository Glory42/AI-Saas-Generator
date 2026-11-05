import type { AuthSession, AuthUser } from "../../../types/auth";

export type IssuedSession = {
  sessionId: string;
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

export type ResolvedAuth = {
  user: AuthUser;
  session: AuthSession;
  // Present when the request was authenticated by rotating the refresh token; cookies must be reset.
  rotated?: IssuedSession;
};
