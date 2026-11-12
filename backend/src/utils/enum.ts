// Entity enums persisted in PostgreSQL.
export enum RoomStatus {
  AVAILABLE = "available",
  OCCUPIED = "occupied",
  RESERVED = "reserved",
  CLEANING = "cleaning",
  MAINTENANCE = "maintenance",
  OUT_OF_ORDER = "out_of_order",
  INACTIVE = "inactive",
}

export enum RoomStayStatus {
  RESERVED = "reserved",
  CHECKED_IN = "checked_in",
  CHECKED_OUT = "checked_out",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}

/** Stay statuses that block room availability. */
export const ACTIVE_STAY_STATUSES: RoomStayStatus[] = [
  RoomStayStatus.RESERVED,
  RoomStayStatus.CHECKED_IN,
];

/**
 * - root: only for initial setup (creates the owner account).
 * - super_admin: the hotel owner, full access.
 * - admin / staff: roles granted to employees.
 */
export enum UserRole {
  ROOT = "root",
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  STAFF = "staff",
}

/** Higher rank can manage accounts of strictly lower rank. */
export const ROLE_RANK: Record<UserRole, number> = {
  [UserRole.ROOT]: 4,
  [UserRole.SUPER_ADMIN]: 3,
  [UserRole.ADMIN]: 2,
  [UserRole.STAFF]: 1,
};

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  LOCKED = "locked",
}

export enum RatePricingType {
  /** basePrice covers baseDurationMinutes, extra time billed per hour. */
  HOURLY = "hourly",
  /** basePrice covers one overnight block, extra time billed per hour. */
  OVERNIGHT = "overnight",
  /** basePrice per started 24-hour day. */
  DAILY = "daily",
}

export enum PaymentMethod {
  CASH = "cash",
  BANK_TRANSFER = "bank_transfer",
}

export enum IdentityStatus {
  ACTIVE = "active",
  REPLACED = "replaced",
}
