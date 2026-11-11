import { AppError } from "~/errors";
import { runInTransaction } from "~/repositories/db";
import { userRepository } from "~/repositories/user.repository";
import { UserRole, UserStatus } from "~/utils/enum";
import { PageQuery, paged } from "~/utils/pagination";
import { hashPassword, toAuthUser } from "./auth.service";

export type CreateUserInput = {
  username: string;
  displayName?: string | null;
  role: UserRole;
  status?: UserStatus;
  password: string;
};

export type UpdateUserInput = {
  displayName?: string | null;
  role?: UserRole;
  status?: UserStatus;
  password?: string;
};

export const userService = {
  async list(q: PageQuery) {
    const [users, total] = await userRepository.list(q);
    return paged(users.map(toAuthUser), total, q);
  },

  async create(input: CreateUserInput) {
    if (await userRepository.existsByUsername(input.username)) {
      throw AppError.conflict("USERNAME_ALREADY_EXISTS", "The username is already in use");
    }
    const passwordHash = await hashPassword(input.password);

    return runInTransaction(async (db) => {
      const user = await userRepository.saveUser(
        {
          username: input.username,
          displayName: input.displayName ?? null,
          role: input.role,
          status: input.status ?? UserStatus.ACTIVE,
        },
        db,
      );
      await userRepository.saveCredential(
        { userId: user.userId, passwordHash, passwordChangedAt: new Date() },
        db,
      );
      return toAuthUser(user);
    });
  },

  async update(userId: string, input: UpdateUserInput, actorUserId: string) {
    const user = await userRepository.findByIdWithCredential(userId);
    if (!user) throw AppError.notFound("USER_NOT_FOUND", "The user does not exist");

    if (userId === actorUserId && (input.role || input.status)) {
      throw AppError.conflict(
        "CANNOT_CHANGE_OWN_ACCESS",
        "You cannot change your own role or status",
      );
    }

    const passwordHash = input.password ? await hashPassword(input.password) : null;

    return runInTransaction(async (db) => {
      if (input.displayName !== undefined) user.displayName = input.displayName;
      if (input.role) user.role = input.role;
      if (input.status) user.status = input.status;
      const { credentials, ...userFields } = user;
      const saved = await userRepository.saveUser(userFields, db);

      if (passwordHash) {
        await userRepository.saveCredential(
          credentials
            ? {
                credentialId: credentials.credentialId,
                passwordHash,
                passwordChangedAt: new Date(),
                failedAttempts: 0,
                lockedUntil: null,
              }
            : { userId, passwordHash, passwordChangedAt: new Date() },
          db,
        );
      }
      return toAuthUser(saved);
    });
  },

  /** Creates the first admin account (INIT=1) when no admin exists. */
  async ensureInitialAdmin(username: string, password: string) {
    if ((await userRepository.countByRole(UserRole.ADMIN)) > 0) return null;
    return this.create({ username, password, role: UserRole.ADMIN, displayName: "Administrator" });
  },
};
