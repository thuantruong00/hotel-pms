<template>
  <PmsLayout title="Phòng & giá" kicker="ROOM SETUP">
    <n-alert v-if="!canEditTypes && !canEditRates && !canEditRooms" type="info" :show-icon="false" style="margin-bottom: 16px">
      Role của bạn chỉ được xem trang này, không tạo/sửa loại phòng, giá hay phòng.
    </n-alert>

    <div class="rooms-grid">
      <!-- Room types -->
      <n-card title="Loại phòng" :bordered="false">
        <template #header-extra>
          <n-button v-if="canEditTypes" size="small" type="primary" @click="openCreateType">+ Thêm</n-button>
        </template>
        <n-data-table
          :columns="typeColumns"
          :data="roomTypes"
          :row-props="(row: RoomType) => ({ style: 'cursor:pointer', onClick: () => selectType(row) })"
          :row-class-name="(row: RoomType) => (row.roomTypeId === selectedType?.roomTypeId ? 'row-selected' : '')"
          size="small"
          :bordered="false"
        />
      </n-card>

      <!-- Rates of the selected type -->
      <n-card :title="selectedType ? `Bảng giá: ${selectedType.name}` : 'Bảng giá'" :bordered="false">
        <template #header-extra>
          <n-button v-if="canEditRates && selectedType" size="small" type="primary" @click="openCreateRate">+ Thêm giá</n-button>
        </template>
        <n-empty v-if="!selectedType" description="Chọn một loại phòng để xem giá" />
        <n-data-table v-else :columns="rateColumns" :data="rates" size="small" :bordered="false" />
      </n-card>
    </div>

    <!-- Rooms -->
    <n-card title="Danh sách phòng" :bordered="false" style="margin-top: 16px">
      <template #header-extra>
        <n-button v-if="canEditRooms" size="small" type="primary" :disabled="!roomTypes.length" @click="openRoomModal">+ Thêm phòng</n-button>
      </template>
      <n-data-table :columns="roomColumns" :data="rooms" size="small" :bordered="false" />
    </n-card>

    <!-- Availability -->
    <n-card title="Kiểm tra phòng trống" :bordered="false" style="margin-top: 16px">
      <n-space align="center" wrap>
        <n-date-picker v-model:value="availRange" type="datetimerange" clearable />
        <n-select v-model:value="availTypeId" :options="typeOptions" placeholder="Mọi loại phòng" clearable style="width: 200px" />
        <n-button type="primary" secondary :disabled="!availRange" @click="checkAvailability">Kiểm tra</n-button>
      </n-space>
      <p v-if="availResult" style="margin-top: 12px">
        <strong>{{ availResult.length }}</strong> phòng trống:
        <n-tag v-for="r in availResult" :key="r.roomId" style="margin: 4px">{{ r.roomNumber }} · {{ r.roomType?.name }}</n-tag>
      </p>
    </n-card>

    <!-- Room type modal -->
    <n-modal v-model:show="typeModal" preset="card" :title="editingTypeId ? 'Sửa loại phòng' : 'Thêm loại phòng'" style="width: 480px">
      <n-form label-placement="left" label-width="110">
        <n-form-item label="Tên"><n-input v-model:value="typeForm.name" placeholder="Phòng đôi" /></n-form-item>
        <n-form-item label="Sức chứa"><n-input-number v-model:value="typeForm.capacity" :min="1" /></n-form-item>
        <n-form-item label="Số giường"><n-input-number v-model:value="typeForm.bedCount" :min="0" /></n-form-item>
        <n-form-item label="Loại giường"><n-input v-model:value="typeForm.bedType" placeholder="queen" /></n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end"><n-button type="primary" :loading="saving" @click="saveType">Lưu</n-button></n-space>
      </template>
    </n-modal>

    <!-- Rate modal -->
    <n-modal v-model:show="rateModal" preset="card" :title="editingRateId ? 'Sửa bảng giá' : 'Thêm bảng giá'" style="width: 520px">
      <n-form label-placement="left" label-width="150">
        <n-form-item label="Tên"><n-input v-model:value="rateForm.name" placeholder="Giá theo giờ" /></n-form-item>
        <n-form-item label="Kiểu tính">
          <n-select v-model:value="rateForm.pricingType" :options="pricingOptions" />
        </n-form-item>
        <n-form-item :label="rateForm.pricingType === 'daily' ? 'Giá mỗi ngày' : 'Giá block đầu'">
          <n-input-number v-model:value="rateForm.basePrice" :min="0" :step="10000" style="width: 100%" />
        </n-form-item>
        <template v-if="rateForm.pricingType !== 'daily'">
          <n-form-item label="Block đầu (phút)">
            <n-input-number v-model:value="rateForm.baseDurationMinutes" :min="1" style="width: 100%" />
          </n-form-item>
          <n-form-item label="Giá mỗi giờ thêm">
            <n-input-number v-model:value="rateForm.additionalHourPrice" :min="0" :step="10000" style="width: 100%" />
          </n-form-item>
          <n-form-item label="Làm tròn (phút)">
            <n-input-number v-model:value="rateForm.roundingMinutes" :min="1" style="width: 100%" />
          </n-form-item>
        </template>
        <n-form-item label="Thời gian trả trễ miễn phí (phút)">
          <n-input-number v-model:value="rateForm.checkOutGraceMinutes" :min="0" style="width: 100%" />
        </n-form-item>
        <n-form-item label="Mặc định"><n-switch v-model:value="rateForm.isDefault" /></n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end"><n-button type="primary" :loading="saving" @click="saveRate">Lưu</n-button></n-space>
      </template>
    </n-modal>

    <!-- Room modal -->
    <n-modal v-model:show="roomModal" preset="card" title="Thêm phòng" style="width: 440px">
      <n-form label-placement="left" label-width="110">
        <n-form-item label="Số phòng"><n-input v-model:value="roomForm.roomNumber" placeholder="101" /></n-form-item>
        <n-form-item label="Tầng"><n-input-number v-model:value="roomForm.floor" /></n-form-item>
        <n-form-item label="Loại phòng"><n-select v-model:value="roomForm.roomTypeId" :options="typeOptions" /></n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end"><n-button type="primary" :loading="saving" @click="createRoom">Lưu</n-button></n-space>
      </template>
    </n-modal>
  </PmsLayout>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import {
  NAlert, NButton, NCard, NDataTable, NDatePicker, NEmpty, NForm, NFormItem, NInput, NInputNumber,
  NModal, NSelect, NSpace, NSwitch, NTag, useDialog, useMessage,
} from 'naive-ui'
import PmsLayout from '../layouts/PmsLayout.vue'
import { del, errorText, get, patch, post } from '../api/client'
import type { PricingType, Room, RoomRate, RoomStatus, RoomType } from '../api/types'
import { fmtMoney, pricingTypeLabel, roomStatusLabel } from '../utils/format'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const canEditTypes = computed(() => auth.can('room-types.write'))
const canEditRates = computed(() => auth.can('room-rates.write'))
const canEditRooms = computed(() => auth.can('rooms.write'))
const message = useMessage()
const dialog = useDialog()
const saving = ref(false)

const roomTypes = ref<RoomType[]>([])
const rates = ref<RoomRate[]>([])
const rooms = ref<Room[]>([])
const selectedType = ref<RoomType | null>(null)

const typeOptions = computed(() => roomTypes.value.map((t) => ({ label: t.name, value: t.roomTypeId })))
const pricingOptions = Object.entries(pricingTypeLabel).map(([value, label]) => ({ value, label }))
const statusOptions = Object.entries(roomStatusLabel).map(([value, label]) => ({ value, label }))

const typeColumns: DataTableColumns<RoomType> = [
  { title: 'Tên', key: 'name' },
  { title: 'Sức chứa', key: 'capacity' },
  { title: 'Giường', key: 'bed', render: (r) => `${r.bedCount} ${r.bedType ?? ''}` },
  {
    title: '',
    key: 'actions',
    render: (r) => canEditTypes.value
      ? h(NSpace, { size: 6 }, {
          default: () => [
            h(NButton, {
              size: 'small',
              onClick: (event: MouseEvent) => {
                event.stopPropagation()
                openEditType(r)
              },
            }, { default: () => 'Sửa' }),
            h(NButton, {
              size: 'small',
              type: 'error',
              secondary: true,
              onClick: (event: MouseEvent) => {
                event.stopPropagation()
                confirmRemoveType(r)
              },
            }, { default: () => 'Xóa' }),
          ],
        })
      : null,
  },
]

const rateColumns: DataTableColumns<RoomRate> = [
  { title: 'Tên', key: 'name', render: (r) => (r.isDefault ? `${r.name} ★` : r.name) },
  { title: 'Kiểu', key: 'pricingType', render: (r) => pricingTypeLabel[r.pricingType] },
  {
    title: 'Giá',
    key: 'price',
    render: (r) =>
      r.pricingType === 'daily'
        ? `${fmtMoney(r.basePrice)} / ngày`
        : `${fmtMoney(r.basePrice)} / ${r.baseDurationMinutes}p đầu, +${fmtMoney(r.additionalHourPrice)}/giờ`,
  },
  {
    title: '',
    key: 'actions',
    render: (r) => canEditRates.value
      ? h(NSpace, { size: 6 }, {
          default: () => [
            h(NButton, { size: 'small', onClick: () => openEditRate(r) }, { default: () => 'Sửa' }),
            h(NButton, { size: 'small', type: 'error', secondary: true, onClick: () => confirmRemoveRate(r) }, { default: () => 'Xóa' }),
          ],
        })
      : null,
  },
]

const roomColumns: DataTableColumns<Room> = [
  { title: 'Số phòng', key: 'roomNumber' },
  { title: 'Tầng', key: 'floor' },
  { title: 'Loại', key: 'type', render: (r) => r.roomType?.name ?? '' },
  {
    title: 'Trạng thái',
    key: 'status',
    render: (r) =>
      canEditRooms.value
        ? h(NSelect, {
            value: r.status,
            options: statusOptions,
            size: 'small',
            style: 'width: 150px',
            'onUpdate:value': (v: RoomStatus) => updateRoomStatus(r, v),
          })
        : roomStatusLabel[r.status],
  },
]

const typeModal = ref(false)
const editingTypeId = ref<string | null>(null)
const typeForm = reactive({ name: '', capacity: 2, bedCount: 1, bedType: '' })

const rateModal = ref(false)
const editingRateId = ref<string | null>(null)
const rateForm = reactive({
  name: 'Theo giờ', pricingType: 'hourly' as PricingType, basePrice: 100000,
  baseDurationMinutes: 60, additionalHourPrice: 50000, roundingMinutes: 30, checkOutGraceMinutes: 30, isDefault: true,
})

const roomModal = ref(false)
const roomForm = reactive({ roomNumber: '', floor: 1 as number | null, roomTypeId: null as string | null })

const availRange = ref<[number, number] | null>(null)
const availTypeId = ref<string | null>(null)
const availResult = ref<Room[] | null>(null)

async function run<T>(fn: () => Promise<T>, ok?: string) {
  saving.value = true
  try {
    const result = await fn()
    if (ok) message.success(ok)
    return result
  } catch (e) {
    message.error(errorText(e))
    return undefined
  } finally {
    saving.value = false
  }
}

async function loadTypes() {
  roomTypes.value = await get<RoomType[]>('/room-types')
  if (!selectedType.value && roomTypes.value[0]) await selectType(roomTypes.value[0])
}
async function loadRooms() {
  rooms.value = await get<Room[]>('/rooms')
}
async function selectType(t: RoomType) {
  selectedType.value = t
  rates.value = await get<RoomRate[]>(`/room-types/${t.roomTypeId}/rates`)
}

function openCreateType() {
  editingTypeId.value = null
  Object.assign(typeForm, { name: '', capacity: 2, bedCount: 1, bedType: '' })
  typeModal.value = true
}

function openEditType(roomType: RoomType) {
  editingTypeId.value = roomType.roomTypeId
  Object.assign(typeForm, {
    name: roomType.name,
    capacity: roomType.capacity,
    bedCount: roomType.bedCount,
    bedType: roomType.bedType ?? '',
  })
  typeModal.value = true
}

function confirmRemoveType(roomType: RoomType) {
  dialog.warning({
    title: 'Xóa loại phòng',
    content: `Bạn có chắc muốn xóa loại phòng "${roomType.name}"? Chỉ loại phòng chưa có phòng và bảng giá mới được xóa.`,
    positiveText: 'Xóa',
    negativeText: 'Hủy',
    onPositiveClick: () => removeType(roomType),
  })
}

async function removeType(roomType: RoomType) {
  saving.value = true
  try {
    await del(`/room-types/${roomType.roomTypeId}`)
    message.success('Đã xóa loại phòng')
    if (selectedType.value?.roomTypeId === roomType.roomTypeId) {
      selectedType.value = null
      rates.value = []
    }
    await Promise.all([loadTypes(), loadRooms()])
  } catch (e) {
    message.error(errorText(e))
  } finally {
    saving.value = false
  }
}

async function saveType() {
  if (editingTypeId.value) {
    const updated = await run(
      () => patch<RoomType>(`/room-types/${editingTypeId.value}`, {
        name: typeForm.name,
        capacity: typeForm.capacity,
        bedCount: typeForm.bedCount,
        bedType: typeForm.bedType || null,
      }),
      'Đã cập nhật loại phòng',
    )
    if (updated) {
      typeModal.value = false
      await loadTypes()
      await selectType(updated)
    }
    return
  }

  const created = await run(
    () => post<RoomType>('/room-types', { ...typeForm, bedType: typeForm.bedType || null }),
    'Đã thêm loại phòng',
  )
  if (created) {
    typeModal.value = false
    await loadTypes()
    await selectType(created)
  }
}

function resetRateForm() {
  Object.assign(rateForm, {
    name: 'Theo giờ', pricingType: 'hourly', basePrice: 100000,
    baseDurationMinutes: 60, additionalHourPrice: 50000, roundingMinutes: 30, checkOutGraceMinutes: 30, isDefault: true,
  })
}

function openCreateRate() {
  editingRateId.value = null
  resetRateForm()
  rateModal.value = true
}

function openEditRate(rate: RoomRate) {
  editingRateId.value = rate.ratePlanId
  Object.assign(rateForm, {
    name: rate.name,
    pricingType: rate.pricingType,
    basePrice: Number(rate.basePrice),
    baseDurationMinutes: rate.baseDurationMinutes,
    additionalHourPrice: Number(rate.additionalHourPrice),
    roundingMinutes: rate.roundingMinutes,
    checkOutGraceMinutes: rate.checkOutGraceMinutes,
    isDefault: rate.isDefault,
  })
  rateModal.value = true
}

function confirmRemoveRate(rate: RoomRate) {
  dialog.warning({
    title: 'Xóa bảng giá',
    content: `Bạn có chắc muốn xóa bảng giá "${rate.name}"? Bảng giá đã được dùng trong phiên lưu trú sẽ không thể xóa.`,
    positiveText: 'Xóa',
    negativeText: 'Hủy',
    onPositiveClick: () => removeRate(rate),
  })
}

async function removeRate(rate: RoomRate) {
  saving.value = true
  try {
    await del(`/room-rates/${rate.ratePlanId}`)
    message.success('Đã xóa bảng giá')
    if (selectedType.value) await selectType(selectedType.value)
  } catch (e) {
    message.error(errorText(e))
  } finally {
    saving.value = false
  }
}

async function saveRate() {
  if (!selectedType.value) return
  const body: Record<string, unknown> = { ...rateForm }
  if (rateForm.pricingType === 'daily') {
    delete body.baseDurationMinutes
    delete body.additionalHourPrice
    delete body.roundingMinutes
  }
  const result = editingRateId.value
    ? await run(() => patch(`/room-rates/${editingRateId.value}`, body), 'Đã cập nhật bảng giá')
    : await run(() => post(`/room-types/${selectedType.value!.roomTypeId}/rates`, body), 'Đã thêm bảng giá')
  if (result) {
    rateModal.value = false
    await selectType(selectedType.value)
  }
}

function openRoomModal() {
  roomForm.roomTypeId = selectedType.value?.roomTypeId ?? roomTypes.value[0]?.roomTypeId ?? null
  roomModal.value = true
}
async function createRoom() {
  const created = await run(() => post('/rooms', roomForm), 'Đã thêm phòng')
  if (created) {
    roomModal.value = false
    roomForm.roomNumber = ''
    await loadRooms()
  }
}

async function updateRoomStatus(room: Room, status: RoomStatus) {
  const ok = await run(() => patch(`/rooms/${room.roomId}`, { status }), `Phòng ${room.roomNumber}: ${roomStatusLabel[status]}`)
  if (ok) await loadRooms()
}

async function checkAvailability() {
  if (!availRange.value) return
  const [from, to] = availRange.value
  const res = await run(() =>
    get<{ rooms: Room[] }>('/rooms/availability', {
      checkInAt: new Date(from).toISOString(),
      checkOutAt: new Date(to).toISOString(),
      roomTypeId: availTypeId.value || undefined,
    }),
  )
  if (res) availResult.value = res.rooms
}

onMounted(() => run(async () => { await loadTypes(); await loadRooms() }))
</script>

<style scoped>
.rooms-grid { display: grid; grid-template-columns: 1fr 1.3fr; gap: 16px; }
@media (max-width: 1100px) { .rooms-grid { grid-template-columns: 1fr; } }
:deep(.row-selected td) { background: #e4f4ec !important; }
</style>
