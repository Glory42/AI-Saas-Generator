import {
  AccountLockedError,
  ConflictError,
  InvalidCredentialsError,
  UnauthorizedError,
} from "../../commons/errors/app-error";
import type { ClientInfo } from "../../commons/http/request-context";
import { AuditService } from "../audit/audit.service";
import { AUDIT_ACTIONS } from "../audit/constants/audit-actions.constants";
import { toAuthUser } from "../users/helpers/user-mapper.helper";
import { isUniqueViolation, UsersRepository } from "../users/repositories/users.repository";
import type { UserRow } from "../users/users.entity";
import type { LoginInput, RegisterInput } from "./dto/auth.dto";
import { evaluateLockout, LOCKOUT_RULES } from "./policies/lockout.policy";
import { LoginAttemptsRepository } from "./repositories/login-attempts.repository";
import { PasswordService } from "./services/password.service";
import { SessionService } from "./services/session.service";
import type { IssuedSession, ResolvedAuth } from "./types/auth.types";

type AuthResult = { user: UserRow; session: IssuedSession };

const assertNotLockedOut = async (email: string, client: ClientInfo): Promise<void> => {
  const now = new Date();
  const [recentEmailAttempts, ipFailures] = await Promise.all([
    LoginAttemptsRepository.recentForEmail(email, LOCKOUT_RULES.emailMaxConsecutiveFailures),
    client.ipAddress
      ? LoginAttemptsRepository.failuresForIpSince(client.ipAddress, new Date(now.getTime() - LOCKOUT_RULES.ipWindowMs))
      : Promise.resolve({ total: 0, oldest: null }),
  ]);

  const decision = evaluateLockout({
    recentEmailAttempts,
    ipFailuresInWindow: ipFailures.total,
    oldestIpFailureAt: ipFailures.oldest,
    now,
  });
  if (!decision.locked) return;

  AuditService.record({
    actorId: null,
    action: AUDIT_ACTIONS.loginBlocked,
    metadata: { email, scope: decision.scope },
    ipAddress: client.ipAddress,
  });
  const message =
    decision.scope === "email"
      ? "Too many failed login attempts for this account. Try again later."
      : "Too many failed login attempts from this network. Try again later.";
  throw new AccountLockedError(message, decision.retryAfterSeconds);
};

const findUserWithPassword = async (email: string, password: string): Promise<UserRow | null> => {
  const user = await UsersRepository.findByEmail(email);
  if (!user) {
    await PasswordService.burnVerifyTime(password);
    return null;
  }

  return (await PasswordService.verify(password, user.passwordHash)) ? user : null;
};

export class AuthService {
  static async register(input: RegisterInput, client: ClientInfo): Promise<AuthResult> {
    const passwordHash = await PasswordService.hash(input.password);

    let user: UserRow;
    try {
      user = await UsersRepository.insert({ email: input.email, username: input.username, passwordHash });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError("An account with this email already exists");
      throw error;
    }

    const session = await SessionService.create(toAuthUser(user), client);
    AuditService.record({ actorId: user.id, action: AUDIT_ACTIONS.register, ipAddress: client.ipAddress });

    return { user, session };
  }

  static async login(input: LoginInput, client: ClientInfo): Promise<AuthResult> {
    await assertNotLockedOut(input.email, client);

    const user = await findUserWithPassword(input.email, input.password);
    await LoginAttemptsRepository.record(input.email, client.ipAddress, user !== null);

    if (!user) {
      AuditService.record({
        actorId: null,
        action: AUDIT_ACTIONS.loginFailed,
        metadata: { email: input.email },
        ipAddress: client.ipAddress,
      });
      throw new InvalidCredentialsError();
    }

    const session = await SessionService.create(toAuthUser(user), client);
    AuditService.record({ actorId: user.id, action: AUDIT_ACTIONS.login, ipAddress: client.ipAddress });

    return { user, session };
  }

  static async refresh(refreshToken: string | null, client: ClientInfo): Promise<ResolvedAuth & { rotated: IssuedSession }> {
    const resolved = refreshToken ? await SessionService.rotate(refreshToken, client) : null;
    if (!resolved) throw new UnauthorizedError("Session expired, please sign in again");
    return resolved;
  }

  static async logout(tokens: { accessToken: string | null; refreshToken: string | null }, client: ClientInfo) {
    let userId: string | null = null;

    if (tokens.refreshToken) {
      userId = await SessionService.revokeByRefreshToken(tokens.refreshToken);
    } else if (tokens.accessToken) {
      const resolved = await SessionService.resolveAccessToken(tokens.accessToken);
      if (resolved) {
        await SessionService.revoke(resolved.session.id);
        userId = resolved.user.id;
      }
    }

    if (userId) {
      AuditService.record({ actorId: userId, action: AUDIT_ACTIONS.logout, ipAddress: client.ipAddress });
    }
  }

  static async logoutAll(userId: string, client: ClientInfo): Promise<void> {
    await SessionService.revokeAll(userId);
    AuditService.record({ actorId: userId, action: AUDIT_ACTIONS.logoutAll, ipAddress: client.ipAddress });
  }
}
