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

export enum RoomRateRuleType {
  FIRST_HOUR = "first_hour",
  ADDITIONAL_HOUR = "additional_hour",
  HOURLY = "hourly",
  OVERNIGHT = "overnight",
  DAILY = "daily",
  EARLY_CHECK_IN_FEE = "early_check_in_fee",
  LATE_CHECK_OUT_FEE = "late_check_out_fee",
  EXTRA_GUEST_FEE = "extra_guest_fee",
  CANCEL_FEE = "cancel_fee",
}
