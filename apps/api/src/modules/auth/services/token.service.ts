import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../../../infrastructure/config/env";
import type { Role } from "../../../types/auth";

const ISSUER = "ai-saas-generator";
const AUDIENCE = "ai-saas-generator-web";
const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export type AccessTokenClaims = { userId: string; sessionId: string; role: Role };

export class TokenService {
  static async signAccessToken(claims: AccessTokenClaims): Promise<{ token: string; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + env.JWT_ACCESS_TTL_SECONDS * 1000);
    const token = await new SignJWT({ sid: claims.sessionId, role: claims.role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(claims.userId)
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .sign(secret);

    return { token, expiresAt };
  }

  static async verifyAccessToken(token: string): Promise<{ userId: string; sessionId: string } | null> {
    try {
      const { payload } = await jwtVerify(token, secret, {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ["HS256"],
      });
      if (typeof payload.sub !== "string" || typeof payload.sid !== "string") return null;

      return { userId: payload.sub, sessionId: payload.sid };
    } catch {
      return null;
    }
  }

  static generateRefreshToken(): string {
    return randomBytes(32).toString("base64url");
  }

  static hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
