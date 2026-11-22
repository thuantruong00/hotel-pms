const money = new Intl.NumberFormat('vi-VN')
const dateTime = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

export const fmtMoney = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === '' ? '—' : `${money.format(Number(v))} ₫`

export const fmtDateTime = (v: string | null | undefined) => (v ? dateTime.format(new Date(v)) : '—')

export const stayStatusLabel: Record<string, { label: string; type: 'default' | 'info' | 'success' | 'warning' | 'error' }> = {
  reserved: { label: 'Đã đặt', type: 'info' },
  checked_in: { label: 'Đang ở', type: 'success' },
  checked_out: { label: 'Đã trả phòng', type: 'default' },
  cancelled: { label: 'Đã huỷ', type: 'error' },
  no_show: { label: 'Không đến', type: 'warning' },
}

export const roomStatusLabel: Record<string, string> = {
  available: 'Trống',
  occupied: 'Có khách',
  reserved: 'Đã đặt',
  cleaning: 'Đang dọn',
  maintenance: 'Bảo trì',
  out_of_order: 'Hỏng',
  inactive: 'Ngưng dùng',
}

export const roleLabels: Record<string, string> = {
  root: 'Root (khởi tạo)',
  super_admin: 'Chủ khách sạn',
  admin: 'Quản lý',
  staff: 'Nhân viên',
}

export const pageLabel: Record<string, string> = {
  dashboard: 'Tổng quan',
  stays: 'Đặt phòng / Lưu trú',
  customers: 'Khách hàng',
  rooms: 'Phòng & giá',
  accounts: 'Tài khoản',
  'change-password': 'Đổi mật khẩu',
}

export const pricingTypeLabel: Record<string, string> = {
  hourly: 'Theo giờ',
  overnight: 'Qua đêm',
  daily: 'Theo ngày',
}
