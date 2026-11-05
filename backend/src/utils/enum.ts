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

export enum UserRole {
  STAFF = "staff",
  MANAGER = "manager",
  ADMIN = "admin",
}

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

export enum WorkSessionStatus {
  OPEN = "open",
  CLOSED = "closed",
}

export enum IdentityStatus {
  ACTIVE = "active",
  REPLACED = "replaced",
}
