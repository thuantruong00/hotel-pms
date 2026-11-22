import { AppError } from "~/errors";
import { runInTransaction } from "~/repositories/db";
import { userRepository } from "~/repositories/user.repository";
import { ROLE_RANK, UserRole, UserStatus } from "~/utils/enum";
import { PageQuery, paged } from "~/utils/pagination";
import { AuthUser, hashPassword, toAuthUser } from "./auth.service";

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

const rankOf = (role: string) => ROLE_RANK[role as UserRole] ?? 0;

/** Roles strictly below the actor's role, e.g. super_admin -> [admin, staff]. */
export const manageableRoles = (actorRole: string): UserRole[] =>
  (Object.values(UserRole) as UserRole[]).filter((r) => rankOf(r) < rankOf(actorRole));

function assertCanAssign(actor: AuthUser, role: UserRole) {
  if (!manageableRoles(actor.role).includes(role)) {
    throw AppError.forbidden("ROLE_NOT_ASSIGNABLE", "You cannot assign this role");
  }
}

export const userService = {
  /** Lists the accounts the actor is allowed to manage. */
  async list(q: PageQuery, actor: AuthUser) {
    const roles = manageableRoles(actor.role);
    const [users, total] = await userRepository.list(q, roles);
    return { ...paged(users.map(toAuthUser), total, q), assignableRoles: roles };
  },

  async create(input: CreateUserInput, actor: AuthUser | null) {
    // `actor` is null only for the initial root bootstrap.
    if (actor) assertCanAssign(actor, input.role);
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

  async update(userId: string, input: UpdateUserInput, actor: AuthUser) {
    if (userId === actor.userId) {
      throw AppError.conflict(
        "CANNOT_CHANGE_OWN_ACCOUNT",
        "Use the change-password page to update your own account",
      );
    }
    const user = await userRepository.findByIdWithCredential(userId);
    if (!user) throw AppError.notFound("USER_NOT_FOUND", "The user does not exist");

    // Only accounts with a lower role can be managed.
    if (rankOf(user.role) >= rankOf(actor.role)) {
      throw AppError.forbidden("ACCOUNT_NOT_MANAGEABLE", "You cannot manage this account");
    }
    if (input.role) assertCanAssign(actor, input.role);

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

  /** Creates the root account used for initial setup (INIT=1) when none exists. */
  async ensureInitialRoot(username: string, password: string) {
    if ((await userRepository.countByRole(UserRole.ROOT)) > 0) return null;
    return this.create({ username, password, role: UserRole.ROOT, displayName: "Root" }, null);
  },
};
