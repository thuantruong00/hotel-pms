import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { AppError } from "~/errors";
import { userRepository } from "~/repositories/user.repository";
import { LoginLockMinutes, MaxFailedLoginAttempts } from "~/utils/const";
import { UserRole, UserStatus } from "~/utils/enum";
import { env } from "~/utils/env";
import { logger } from "~/utils/logger";
import { User } from "~/entities/user.entity";
import { UserCredential } from "~/entities/user-credential.entity";

export type AuthUser = {
  userId: string;
  username: string;
  displayName: string | null;
  role: string;
  status: string;
};

let devSecret: string | null = null;
let dummyHash: string | null = null;

function jwtSecret(): string {
  if (env.JWT_SECRET) return env.JWT_SECRET;
  if (env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production");
  }
  if (!devSecret) {
    devSecret = crypto.randomBytes(32).toString("hex");
    logger.warn("JWT_SECRET is not set; using a random secret (tokens reset on restart)");
  }
  return devSecret;
}

const VALID_ROLES = new Set<string>(Object.values(UserRole));

export const toAuthUser = (user: User): AuthUser => ({
  userId: user.userId,
  username: user.username,
  displayName: user.displayName,
  role: user.role,
  status: user.status,
});

/** Rejects users that are inactive, locked, or carry an unknown role. */
function assertUserCanAccess(user: User, credential?: UserCredential | null) {
  if (user.status === UserStatus.LOCKED) {
    throw AppError.forbidden("ACCOUNT_LOCKED", "The user account is locked");
  }
  if (user.status !== UserStatus.ACTIVE) {
    throw AppError.forbidden("ACCOUNT_INACTIVE", "The user account is not active");
  }
  if (credential?.lockedUntil && credential.lockedUntil.getTime() > Date.now()) {
    throw AppError.forbidden(
      "ACCOUNT_LOCKED",
      "The user account is temporarily locked. Please try again later",
    );
  }
  if (!VALID_ROLES.has(user.role)) {
    // Legacy role names (guest/user/root) are not accepted by the new API.
    throw AppError.forbidden();
  }
}

export const hashPassword = (password: string) => bcrypt.hash(password, 10);

export const authService = {
  async login(username: string, password: string) {
    const user = await userRepository.findByUsernameWithCredential(username);
    const credential = user?.credentials;
    const invalid = AppError.unauthorized(
      "INVALID_CREDENTIALS",
      "The username or password is incorrect",
    );

    if (!user || !credential) {
      // Keep response timing similar for unknown users.
      dummyHash ??= await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);
      await bcrypt.compare(password, dummyHash);
      throw invalid;
    }

    if (credential.lockedUntil && credential.lockedUntil.getTime() > Date.now()) {
      assertUserCanAccess(user, credential);
    }

    const matches = await bcrypt.compare(password, credential.passwordHash);
    if (!matches) {
      const failedAttempts = credential.failedAttempts + 1;
      const lock = failedAttempts >= MaxFailedLoginAttempts;
      await userRepository.saveCredential({
        credentialId: credential.credentialId,
        failedAttempts: lock ? 0 : failedAttempts,
        lockedUntil: lock ? new Date(Date.now() + LoginLockMinutes * 60000) : credential.lockedUntil,
      });
      throw invalid;
    }

    assertUserCanAccess(user, null);

    await userRepository.saveCredential({
      credentialId: credential.credentialId,
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });

    const accessToken = jwt.sign({ sub: user.userId }, jwtSecret(), {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });

    return { accessToken, tokenType: "Bearer", user: toAuthUser(user) };
  },

  /** Verifies the token and reloads the user, role, and status from the database. */
  async authenticateToken(token: string): Promise<AuthUser> {
    let userId: string;
    try {
      const payload = jwt.verify(token, jwtSecret());
      if (typeof payload !== "object" || typeof payload.sub !== "string") {
        throw new Error("invalid payload");
      }
      userId = payload.sub;
    } catch {
      throw AppError.unauthorized("INVALID_TOKEN", "The access token is invalid or expired");
    }

    const user = await userRepository.findByIdWithCredential(userId);
    if (!user) {
      throw AppError.unauthorized("INVALID_TOKEN", "The access token is invalid or expired");
    }
    assertUserCanAccess(user, user.credentials);
    return toAuthUser(user);
  },
};
