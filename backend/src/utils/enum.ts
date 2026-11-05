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

export enum UserRole {
  STAFF = "staff",
  MANAGER = "manager",
  ADMIN = "admin",
  GUEST = "guest",
  USER = "staff",
  ROOT = "admin",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  LOCKED = "locked",
}
