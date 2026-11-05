import { UserRole } from "~/utils/enum";

/**
 * Stable permission codes (lowercase, dot notation). See
 * docs/api/authorization.md for the permission matrix.
 */
export const Permission = {
  ROOMS_READ: "rooms.read",
  ROOMS_WRITE: "rooms.write",
  ROOM_TYPES_WRITE: "room-types.write",
  ROOM_RATES_WRITE: "room-rates.write",
  ROOM_STAYS_READ: "room-stays.read",
  ROOM_STAYS_WRITE: "room-stays.write",
  CUSTOMERS_READ: "customers.read",
  CUSTOMERS_WRITE: "customers.write",
  BILLING_READ: "billing.read",
  BILLING_WRITE: "billing.write",
  WORK_SESSIONS_READ: "work-sessions.read",
  WORK_SESSIONS_WRITE: "work-sessions.write",
  WORK_SESSIONS_OVERSIGHT: "work-sessions.oversight",
  USERS_MANAGE: "users.manage",
  SYSTEM_CONFIG: "system.config",
} as const;

export type PermissionCode = (typeof Permission)[keyof typeof Permission];

const staffPermissions: PermissionCode[] = [
  Permission.ROOMS_READ,
  Permission.ROOM_STAYS_READ,
  Permission.ROOM_STAYS_WRITE,
  Permission.CUSTOMERS_READ,
  Permission.CUSTOMERS_WRITE,
  Permission.BILLING_READ,
  Permission.BILLING_WRITE,
  Permission.WORK_SESSIONS_READ,
  Permission.WORK_SESSIONS_WRITE,
];

const managerPermissions: PermissionCode[] = [
  ...staffPermissions,
  Permission.ROOMS_WRITE,
  Permission.ROOM_TYPES_WRITE,
  Permission.ROOM_RATES_WRITE,
  Permission.WORK_SESSIONS_OVERSIGHT,
];

/** Default matrix used when backend/data/roleAccess.json does not override a role. */
export const DefaultRolePermissions: Record<UserRole, string[]> = {
  [UserRole.STAFF]: staffPermissions,
  [UserRole.MANAGER]: managerPermissions,
  [UserRole.ADMIN]: ["*"],
};
