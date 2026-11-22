/**
 * Stable permission codes (lowercase, dot notation). Which role holds which
 * code is configured in `role-access.json` (docs/api/authorization.md).
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
  USERS_MANAGE: "users.manage",
  SYSTEM_CONFIG: "system.config",
} as const;

export type PermissionCode = (typeof Permission)[keyof typeof Permission];

/** Frontend page keys a role may see. */
export const PageKey = {
  DASHBOARD: "dashboard",
  STAYS: "stays",
  CUSTOMERS: "customers",
  ROOMS: "rooms",
  ACCOUNTS: "accounts",
  CHANGE_PASSWORD: "change-password",
} as const;
