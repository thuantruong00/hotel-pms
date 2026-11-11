<template>
  <PmsLayout title="Đặt phòng / Lưu trú" kicker="RESERVATIONS">
    <n-alert v-if="!auth.session" type="warning" :show-icon="false" style="margin-bottom: 16px">
      Bạn chưa mở ca làm việc. Vẫn đặt phòng được, nhưng lượt đặt sẽ không gắn với ca nào.
    </n-alert>

    <n-card :bordered="false">
      <n-space justify="space-between" style="margin-bottom: 12px">
        <n-radio-group v-model:value="statusFilter" @update:value="load(1)">
          <n-radio-button value="">Tất cả</n-radio-button>
          <n-radio-button v-for="(s, key) in stayStatusLabel" :key="key" :value="key">{{ s.label }}</n-radio-button>
        </n-radio-group>
        <n-space>
          <n-button @click="load(page.page)">Tải lại</n-button>
          <n-button type="primary" @click="openCreate">+ Đặt phòng</n-button>
        </n-space>
      </n-space>
      <n-data-table
        remote
        :columns="columns"
        :data="page.items"
        :pagination="pagination"
        :loading="loading"
        size="small"
        :bordered="false"
        @update:page="load"
      />
    </n-card>

    <!-- Create stay -->
    <n-modal v-model:show="createOpen" preset="card" title="Đặt phòng mới" style="width: 640px">
      <n-form label-placement="left" label-width="120">
        <n-form-item label="Thời gian">
          <n-date-picker v-model:value="form.range" type="datetimerange" style="width: 100%" @update:value="findRooms" />
        </n-form-item>
        <n-form-item label="Phòng">
          <n-select
            v-model:value="form.roomId"
            :options="roomOptions"
            :placeholder="form.range ? 'Chọn phòng trống' : 'Chọn thời gian trước'"
            :disabled="!form.range"
            filterable
            @update:value="loadRates"
          />
        </n-form-item>
        <n-form-item label="Bảng giá">
          <n-select v-model:value="form.roomRateId" :options="rateOptions" :disabled="!form.roomId" placeholder="Chọn giá" />
        </n-form-item>
        <n-form-item label="Khách">
          <n-select
            v-model:value="form.customerIds"
            multiple
            filterable
            remote
            clearable
            :options="customerOptions"
            :loading="searchingCustomers"
            placeholder="Gõ để tìm khách (tên, SĐT, giấy tờ)"
            @search="searchCustomers"
            @focus="searchCustomers('')"
          />
        </n-form-item>
        <n-form-item v-if="form.customerIds.length" label="Khách chính">
          <n-radio-group v-model:value="form.primaryId">
            <n-space vertical>
              <n-radio v-for="id in form.customerIds" :key="id" :value="id">{{ customerName(id) }}</n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="Ghi chú"><n-input v-model:value="form.notes" type="textarea" :rows="2" /></n-form-item>
      </n-form>
      <p class="muted" style="margin: 0">Chưa có khách? Thêm ở trang Khách hàng trước.</p>
      <template #footer>
        <n-space justify="end">
          <n-button type="primary" :loading="saving" @click="createStay">Tạo đặt phòng</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- Stay detail -->
    <n-drawer v-model:show="detailOpen" :width="560">
      <n-drawer-content v-if="stay" closable>
        <template #header>
          Phòng {{ stay.room?.roomNumber }} ·
          <n-tag :type="stayStatusLabel[stay.status].type" :bordered="false">{{ stayStatusLabel[stay.status].label }}</n-tag>
        </template>

        <n-descriptions :column="1" label-placement="left" size="small" bordered>
          <n-descriptions-item label="Mã đặt phòng">{{ stay.reservationCode }}</n-descriptions-item>
          <n-descriptions-item label="Loại phòng">{{ stay.room?.roomType?.name }}</n-descriptions-item>
          <n-descriptions-item label="Bảng giá">{{ stay.ratePlan?.name }} ({{ stay.ratePlan ? pricingTypeLabel[stay.ratePlan.pricingType] : '' }})</n-descriptions-item>
          <n-descriptions-item label="Dự kiến">{{ fmtDateTime(stay.plannedCheckInAt) }} → {{ fmtDateTime(stay.plannedCheckOutAt) }}</n-descriptions-item>
          <n-descriptions-item label="Thực tế">{{ fmtDateTime(stay.actualCheckInAt) }} → {{ fmtDateTime(stay.actualCheckOutAt) }}</n-descriptions-item>
          <n-descriptions-item v-if="stay.notes" label="Ghi chú"><span style="white-space: pre-line">{{ stay.notes }}</span></n-descriptions-item>
        </n-descriptions>

        <div v-if="stay.status === 'reserved'" key="actions-reserved" class="stay-actions">
          <n-button type="primary" :loading="saving" @click="action('check-in', 'Đã nhận phòng')">Check-in</n-button>
          <n-button :loading="saving" @click="confirmAction('cancel', 'Huỷ đặt phòng này?', 'Đã huỷ')">Huỷ</n-button>
          <n-button :loading="saving" @click="confirmAction('no-show', 'Đánh dấu khách không đến?', 'Đã đánh dấu không đến')">Không đến</n-button>
        </div>
        <div v-else-if="stay.status === 'checked_in'" key="actions-checked-in" class="stay-actions">
          <n-button type="primary" :loading="saving" @click="confirmAction('check-out', 'Trả phòng ngay bây giờ?', 'Đã trả phòng')">
            Check-out
          </n-button>
        </div>

        <n-divider title-placement="left">Khách ({{ stay.guests?.length ?? 0 }})</n-divider>
        <div v-for="g in stay.guests" :key="g.roomStayCustomerId" class="guest-row">
          {{ g.customer?.fullName || '(chưa có tên)' }} <span class="muted">{{ g.customer?.phone }}</span>
          <n-tag v-if="g.isPrimary" size="small" type="success" :bordered="false">Khách chính</n-tag>
        </div>
        <n-space v-if="stay.status === 'reserved' || stay.status === 'checked_in'" style="margin-top: 8px">
          <n-select
            v-model:value="addCustomerId"
            filterable
            remote
            clearable
            :options="customerOptions"
            :loading="searchingCustomers"
            placeholder="Thêm khách vào phòng"
            style="width: 280px"
            @search="searchCustomers"
            @focus="searchCustomers('')"
          />
          <n-checkbox v-model:checked="addAsPrimary">Là khách chính</n-checkbox>
          <n-button :disabled="!addCustomerId" :loading="saving" @click="addCustomer">Thêm</n-button>
        </n-space>

        <!-- Bill -->
        <n-divider title-placement="left">Hoá đơn</n-divider>
        <template v-if="bill">
          <template v-if="bill.finalized">
            <n-descriptions :column="1" label-placement="left" size="small" bordered>
              <n-descriptions-item label="Tiền phòng">{{ fmtMoney(bill.snapshot?.amounts?.roomAmount) }}</n-descriptions-item>
              <n-descriptions-item label="Giảm giá">-{{ fmtMoney(bill.snapshot?.amounts?.discountAmount) }}</n-descriptions-item>
              <n-descriptions-item label="Phụ thu">{{ fmtMoney(bill.snapshot?.amounts?.surchargeAmount) }}</n-descriptions-item>
              <n-descriptions-item label="Phạt">{{ fmtMoney(bill.snapshot?.amounts?.penaltyAmount) }}</n-descriptions-item>
              <n-descriptions-item label="Tổng cộng"><strong>{{ fmtMoney(bill.totalAmount) }}</strong></n-descriptions-item>
              <n-descriptions-item label="Thanh toán">
                <n-tag v-if="bill.isPaid" type="success" :bordered="false">
                  Đã thanh toán ({{ paymentLabel(bill.paymentMethod) }}) · {{ fmtDateTime(bill.paidAt) }}
                </n-tag>
                <n-tag v-else type="warning" :bordered="false">Chưa thanh toán</n-tag>
              </n-descriptions-item>
            </n-descriptions>
            <n-space v-if="!bill.isPaid" align="center" style="margin-top: 12px">
              <n-radio-group v-model:value="paymentMethod">
                <n-radio value="cash">Tiền mặt</n-radio>
                <n-radio value="bank_transfer">Chuyển khoản</n-radio>
              </n-radio-group>
              <n-button type="primary" :loading="saving" @click="markPaid">Xác nhận đã thanh toán</n-button>
            </n-space>
          </template>

          <template v-else-if="bill.preview">
            <n-descriptions :column="1" label-placement="left" size="small" bordered>
              <n-descriptions-item label="Thời lượng">{{ bill.preview.durationMinutes }} phút</n-descriptions-item>
              <n-descriptions-item v-if="bill.preview.billedDays" label="Số ngày tính">{{ bill.preview.billedDays }}</n-descriptions-item>
              <n-descriptions-item v-else label="Phút tính thêm">{{ bill.preview.extraBilledMinutes }}</n-descriptions-item>
              <n-descriptions-item label="Tiền phòng (tạm tính)">{{ fmtMoney(bill.preview.roomAmount) }}</n-descriptions-item>
            </n-descriptions>
            <template v-if="stay.status === 'checked_out'">
              <n-form label-placement="left" label-width="110" style="margin-top: 12px">
                <n-form-item label="Giảm giá"><n-input-number v-model:value="finalize.discountAmount" :min="0" :step="10000" style="width: 100%" /></n-form-item>
                <n-form-item label="Phụ thu"><n-input-number v-model:value="finalize.surchargeAmount" :min="0" :step="10000" style="width: 100%" /></n-form-item>
                <n-form-item label="Phạt"><n-input-number v-model:value="finalize.penaltyAmount" :min="0" :step="10000" style="width: 100%" /></n-form-item>
                <n-form-item v-if="finalize.penaltyAmount" label="Lý do phạt"><n-input v-model:value="finalize.penaltyReason" /></n-form-item>
              </n-form>
              <n-button type="primary" :loading="saving" @click="finalizeBill">Chốt hoá đơn</n-button>
            </template>
            <p v-else class="muted">Chốt hoá đơn sau khi khách trả phòng.</p>
          </template>
          <p v-else class="muted">Không có hoá đơn cho lượt đặt này.</p>
        </template>
      </n-drawer-content>
    </n-drawer>
  </PmsLayout>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, watch } from 'vue'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import {
  NAlert, NButton, NCard, NCheckbox, NDataTable, NDatePicker, NDescriptions, NDescriptionsItem, NDivider,
  NDrawer, NDrawerContent, NForm, NFormItem, NInput, NInputNumber, NModal, NRadio, NRadioButton, NRadioGroup,
  NSelect, NSpace, NTag, useDialog, useMessage,
} from 'naive-ui'
import PmsLayout from '../layouts/PmsLayout.vue'
import { errorText, get, post } from '../api/client'
import type { Bill, Customer, Paged, Room, RoomRate, RoomStay } from '../api/types'
import { fmtDateTime, fmtMoney, pricingTypeLabel, stayStatusLabel } from '../utils/format'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const saving = ref(false)

// ─── List ─────────────────────────────────────────────────────────
const statusFilter = ref('')
const page = ref<Paged<RoomStay>>({ items: [], page: 1, limit: 20, total: 0 })
const pagination = computed(() => ({ page: page.value.page, pageSize: page.value.limit, itemCount: page.value.total }))

const primaryName = (s: RoomStay) => s.guests?.find((g) => g.isPrimary)?.customer?.fullName || '(chưa có tên)'

const columns: DataTableColumns<RoomStay> = [
  { title: 'Mã', key: 'reservationCode' },
  { title: 'Phòng', key: 'room', render: (r) => r.room?.roomNumber ?? '' },
  { title: 'Khách chính', key: 'guest', render: (r) => `${primaryName(r)}${r.guestCount > 1 ? ` +${r.guestCount - 1}` : ''}` },
  { title: 'Dự kiến', key: 'plan', render: (r) => `${fmtDateTime(r.plannedCheckInAt)} → ${fmtDateTime(r.plannedCheckOutAt)}` },
  {
    title: 'Trạng thái',
    key: 'status',
    render: (r) => h(NTag, { bordered: false, type: stayStatusLabel[r.status].type }, { default: () => stayStatusLabel[r.status].label }),
  },
  {
    title: 'Hoá đơn',
    key: 'charge',
    render: (r) =>
      r.charge
        ? h(NTag, { size: 'small', bordered: false, type: r.charge.isPaid ? 'success' : 'warning' },
            { default: () => `${fmtMoney(r.charge!.amount)} · ${r.charge!.isPaid ? 'đã TT' : 'chưa TT'}` })
        : '',
  },
  { title: '', key: 'open', render: (r) => h(NButton, { size: 'small', onClick: () => openDetail(r.stayId) }, { default: () => 'Mở' }) },
]

async function load(p = 1) {
  loading.value = true
  try {
    page.value = await get<Paged<RoomStay>>('/room-stays', { page: p, limit: 20, status: statusFilter.value || undefined })
  } catch (e) {
    message.error(errorText(e))
  } finally {
    loading.value = false
  }
}

// ─── Customer search (shared) ─────────────────────────────────────
const knownCustomers = reactive(new Map<string, Customer>())
const customerOptions = ref<SelectOption[]>([])
const searchingCustomers = ref(false)
const customerName = (id: string) => knownCustomers.get(id)?.fullName || '(chưa có tên)'

async function searchCustomers(q: string) {
  searchingCustomers.value = true
  try {
    const res = await get<Paged<Customer>>('/customers', { search: q.trim() || undefined, limit: 20, isActive: true })
    res.items.forEach((c) => knownCustomers.set(c.customerId, c))
    const ids = new Set([...res.items.map((c) => c.customerId), ...form.customerIds])
    customerOptions.value = [...ids].map((id) => {
      const c = knownCustomers.get(id)!
      return { value: id, label: `${c.fullName || '(chưa có tên)'}${c.phone ? ` · ${c.phone}` : ''}` }
    })
  } catch (e) {
    message.error(errorText(e))
  } finally {
    searchingCustomers.value = false
  }
}

// ─── Create ───────────────────────────────────────────────────────
const createOpen = ref(false)
const form = reactive({
  range: null as [number, number] | null,
  roomId: null as string | null,
  roomRateId: null as string | null,
  customerIds: [] as string[],
  primaryId: null as string | null,
  notes: '',
})
const availableRooms = ref<Room[]>([])
const rates = ref<RoomRate[]>([])
const roomOptions = computed(() => availableRooms.value.map((r) => ({ value: r.roomId, label: `${r.roomNumber} · ${r.roomType?.name}` })))
const rateOptions = computed(() => rates.value.map((r) => ({ value: r.ratePlanId, label: `${r.name} (${pricingTypeLabel[r.pricingType]}) · ${fmtMoney(r.basePrice)}` })))

function openCreate() {
  const start = new Date()
  start.setMinutes(0, 0, 0)
  start.setHours(start.getHours() + 1)
  Object.assign(form, { range: [start.getTime(), start.getTime() + 2 * 3600e3], roomId: null, roomRateId: null, customerIds: [], primaryId: null, notes: '' })
  createOpen.value = true
  findRooms()
}

async function findRooms() {
  form.roomId = null
  form.roomRateId = null
  availableRooms.value = []
  if (!form.range) return
  try {
    const res = await get<{ rooms: Room[] }>('/rooms/availability', {
      checkInAt: new Date(form.range[0]).toISOString(),
      checkOutAt: new Date(form.range[1]).toISOString(),
    })
    availableRooms.value = res.rooms
  } catch (e) {
    message.error(errorText(e))
  }
}

async function loadRates() {
  form.roomRateId = null
  rates.value = []
  const room = availableRooms.value.find((r) => r.roomId === form.roomId)
  if (!room) return
  try {
    rates.value = await get<RoomRate[]>(`/room-types/${room.roomTypeId}/rates`, { isActive: true })
    form.roomRateId = rates.value.find((r) => r.isDefault)?.ratePlanId ?? rates.value[0]?.ratePlanId ?? null
  } catch (e) {
    message.error(errorText(e))
  }
}

async function createStay() {
  if (!form.range || !form.roomId || !form.roomRateId) return message.warning('Chọn thời gian, phòng và bảng giá')
  if (!form.customerIds.length) return message.warning('Chọn ít nhất một khách')
  const primaryId = form.customerIds.includes(form.primaryId ?? '') ? form.primaryId : form.customerIds[0]
  saving.value = true
  try {
    const res = await post<{ stayId: string; reservationCode: string }>('/room-stays', {
      roomId: form.roomId,
      roomRateId: form.roomRateId,
      plannedCheckInAt: new Date(form.range[0]).toISOString(),
      plannedCheckOutAt: new Date(form.range[1]).toISOString(),
      customers: form.customerIds.map((id) => ({ customerId: id, isPrimary: id === primaryId })),
      ...(auth.session ? { sessionId: auth.session.sessionId } : {}),
      notes: form.notes.trim() || null,
    })
    message.success(`Đã đặt phòng ${res.reservationCode}`)
    createOpen.value = false
    await load(1)
    await openDetail(res.stayId)
  } catch (e) {
    message.error(errorText(e))
  } finally {
    saving.value = false
  }
}

// ─── Detail ───────────────────────────────────────────────────────
const detailOpen = ref(false)
const stay = ref<RoomStay | null>(null)
const bill = ref<Bill | null>(null)
const addCustomerId = ref<string | null>(null)
const addAsPrimary = ref(false)
const paymentMethod = ref<'cash' | 'bank_transfer'>('cash')
const finalize = reactive({ discountAmount: 0, surchargeAmount: 0, penaltyAmount: 0, penaltyReason: '' })
const paymentLabel = (m?: string) => (m === 'bank_transfer' ? 'chuyển khoản' : 'tiền mặt')

async function openDetail(id: string) {
  try {
    const [s, b] = await Promise.all([get<RoomStay>(`/room-stays/${id}`), get<Bill>(`/room-stays/${id}/bill`)])
    stay.value = s
    bill.value = b
    s.guests?.forEach((g) => g.customer && knownCustomers.set(g.customerId, g.customer))
    Object.assign(finalize, { discountAmount: 0, surchargeAmount: 0, penaltyAmount: 0, penaltyReason: '' })
    addCustomerId.value = null
    addAsPrimary.value = false
    detailOpen.value = true
  } catch (e) {
    message.error(errorText(e))
  }
}

async function mutate(fn: () => Promise<unknown>, ok: string) {
  if (!stay.value) return
  saving.value = true
  try {
    await fn()
    message.success(ok)
    await Promise.all([openDetail(stay.value.stayId), load(page.value.page)])
  } catch (e) {
    message.error(errorText(e))
  } finally {
    saving.value = false
  }
}

const action = (path: string, ok: string) => mutate(() => post(`/room-stays/${stay.value!.stayId}/${path}`), ok)

function confirmAction(path: string, question: string, ok: string) {
  dialog.warning({
    title: 'Xác nhận',
    content: question,
    positiveText: 'Đồng ý',
    negativeText: 'Thôi',
    onPositiveClick: () => action(path, ok),
  })
}

const addCustomer = () =>
  mutate(
    () => post(`/room-stays/${stay.value!.stayId}/customers`, { customers: [{ customerId: addCustomerId.value, isPrimary: addAsPrimary.value }] }),
    'Đã thêm khách',
  )

const finalizeBill = () =>
  mutate(
    () => post(`/room-stays/${stay.value!.stayId}/bill/finalize`, {
      discountAmount: finalize.discountAmount ?? 0,
      surchargeAmount: finalize.surchargeAmount ?? 0,
      penaltyAmount: finalize.penaltyAmount ?? 0,
      penaltyReason: finalize.penaltyReason.trim() || null,
    }),
    'Đã chốt hoá đơn',
  )

const markPaid = () =>
  mutate(() => post(`/room-stays/${stay.value!.stayId}/bill/mark-paid`, { paymentMethod: paymentMethod.value }), 'Đã ghi nhận thanh toán')

// Keep the primary guest valid: default to the first selected customer.
watch(
  () => [...form.customerIds],
  (ids) => {
    if (!form.primaryId || !ids.includes(form.primaryId)) form.primaryId = ids[0] ?? null
  },
)

onMounted(() => load(1))
</script>

<style scoped>
.guest-row { display: flex; gap: 8px; align-items: center; padding: 4px 0; }
.stay-actions { display: flex; gap: 8px; margin: 16px 0; }
</style>
