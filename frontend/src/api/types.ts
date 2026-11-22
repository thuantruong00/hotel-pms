export type Paged<T> = { items: T[]; page: number; limit: number; total: number }

export type Role = 'root' | 'super_admin' | 'admin' | 'staff'

export type PageKey = 'dashboard' | 'stays' | 'customers' | 'rooms' | 'accounts' | 'change-password'

export type Account = {
  userId: string
  username: string
  displayName: string | null
  role: Role
  status: 'active' | 'inactive' | 'locked'
}

/** Signed-in user with the pages and permissions configured for their role. */
export type AuthUser = Account & {
  pages: PageKey[]
  permissions: string[]
}

export type RoomType = {
  roomTypeId: string
  code: string
  name: string
  capacity: number
  bedCount: number
  bedType: string | null
  description: string | null
  isActive: boolean
}

export type PricingType = 'hourly' | 'overnight' | 'daily'

export type RoomRate = {
  ratePlanId: string
  roomTypeId: string
  code: string
  name: string
  pricingType: PricingType
  basePrice: string
  baseDurationMinutes: number
  additionalHourPrice: string
  roundingMinutes: number
  checkOutGraceMinutes: number
  isDefault: boolean
  isActive: boolean
}

export type RoomStatus =
  | 'available' | 'occupied' | 'reserved' | 'cleaning'
  | 'maintenance' | 'out_of_order' | 'inactive'

export type Room = {
  roomId: string
  roomTypeId: string
  roomType?: RoomType
  roomNumber: string
  floor: number | null
  status: RoomStatus
  notes: string | null
  isActive: boolean
}

export type CustomerIdentity = {
  identityId: string
  identityType: string
  identityNumber: string
  nationality: string | null
  status: string
}

export type Customer = {
  customerId: string
  fullName: string | null
  phone: string | null
  email: string | null
  notes: string | null
  isActive: boolean
  identities?: CustomerIdentity[]
}

export type StayStatus = 'reserved' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'

export type RoomStayCharge = {
  chargeId: string
  amount: string
  isPaid: boolean
  paymentMethod: string
  paidAt: string | null
}

export type RoomStay = {
  stayId: string
  reservationCode: string | null
  roomId: string
  room?: Room
  ratePlan?: RoomRate | null
  status: StayStatus
  plannedCheckInAt: string
  plannedCheckOutAt: string
  actualCheckInAt: string | null
  actualCheckOutAt: string | null
  guestCount: number
  roomAmount: string
  totalAmount: string
  notes: string | null
  guests?: { roomStayCustomerId: string; customerId: string; isPrimary: boolean; customer?: Customer }[]
  charge?: RoomStayCharge | null
}

export type Bill = {
  stayId: string
  finalized: boolean
  status?: StayStatus
  totalAmount?: string
  isPaid?: boolean
  paymentMethod?: string
  paidAt?: string | null
  snapshot?: { amounts?: Record<string, string | null>; calculation?: Record<string, unknown> } | null
  preview?: {
    durationMinutes: number
    extraBilledMinutes: number
    billedDays: number
    roomAmount: string
    discountAmount: string
    surchargeAmount: string
    penaltyAmount: string
    totalAmount: string
  } | null
}
