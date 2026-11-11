<template>
  <PmsLayout title="Tổng quan" kicker="PROPERTY OVERVIEW">
    <div class="dashboard-page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">{{ today }}</p>
          <h2>Tình hình khách sạn</h2>
        </div>
        <n-space>
          <n-button @click="load" :loading="loading">Tải lại</n-button>
          <n-button type="primary" @click="router.push('/stays')">+ Đặt phòng</n-button>
        </n-space>
      </div>

      <n-grid :cols="4" :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
        <n-gi v-for="stat in stats" :key="stat.label" span="4 m:2 l:1">
          <n-card :bordered="false" class="stat-card">
            <p class="stat-label">{{ stat.label }}</p>
            <div class="stat-value">{{ stat.value }}</div>
            <span class="stat-change neutral">{{ stat.hint }}</span>
          </n-card>
        </n-gi>
      </n-grid>

      <div class="dashboard-grid">
        <n-card :bordered="false" title="Khách đang ở / sắp đến" class="reservation-card">
          <template #header-extra>
            <n-button text type="primary" @click="router.push('/stays')">Xem tất cả</n-button>
          </template>
          <n-data-table :columns="columns" :data="activeStays" :bordered="false" size="small" />
        </n-card>

        <n-card :bordered="false" title="Trạng thái phòng" class="room-card">
          <div v-for="row in roomRows" :key="row.status" class="room-row">
            <div class="room-label">
              <span class="room-dot" :class="row.status"></span>
              <span>{{ roomStatusLabel[row.status] }}</span>
            </div>
            <strong>{{ row.count }} phòng</strong>
          </div>
          <n-empty v-if="!roomRows.length" description="Chưa có phòng" />
          <n-button secondary block class="room-button" @click="router.push('/rooms')">Quản lý phòng</n-button>
        </n-card>
      </div>
    </div>
  </PmsLayout>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NCard, NDataTable, NEmpty, NGi, NGrid, NSpace, NTag, useMessage } from 'naive-ui'
import PmsLayout from '../layouts/PmsLayout.vue'
import { errorText, get } from '../api/client'
import type { Paged, Room, RoomStay } from '../api/types'
import { fmtDateTime, roomStatusLabel, stayStatusLabel } from '../utils/format'

const router = useRouter()
const message = useMessage()
const loading = ref(false)
const rooms = ref<Room[]>([])
const reserved = ref<Paged<RoomStay> | null>(null)
const checkedIn = ref<Paged<RoomStay> | null>(null)

const today = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
  .format(new Date()).toUpperCase()

const roomRows = computed(() => {
  const counts = new Map<string, number>()
  for (const r of rooms.value) counts.set(r.status, (counts.get(r.status) ?? 0) + 1)
  return [...counts.entries()].map(([status, count]) => ({ status, count }))
})

const stats = computed(() => {
  const total = rooms.value.filter((r) => r.isActive).length
  const occupied = checkedIn.value?.total ?? 0
  return [
    { label: 'Tổng số phòng', value: String(total), hint: 'đang hoạt động' },
    { label: 'Đang có khách', value: String(occupied), hint: total ? `${Math.round((occupied / total) * 100)}% công suất` : '—' },
    { label: 'Đặt trước', value: String(reserved.value?.total ?? 0), hint: 'chưa nhận phòng' },
    { label: 'Phòng trống', value: String(rooms.value.filter((r) => r.status === 'available').length), hint: 'theo trạng thái phòng' },
  ]
})

const activeStays = computed(() => [...(checkedIn.value?.items ?? []), ...(reserved.value?.items ?? [])])

const columns: DataTableColumns<RoomStay> = [
  { title: 'Phòng', key: 'room', render: (r) => r.room?.roomNumber ?? '—' },
  {
    title: 'Khách chính',
    key: 'guest',
    render: (r) => r.guests?.find((g) => g.isPrimary)?.customer?.fullName || '(chưa có tên)',
  },
  { title: 'Dự kiến', key: 'plan', render: (r) => `${fmtDateTime(r.plannedCheckInAt)} → ${fmtDateTime(r.plannedCheckOutAt)}` },
  {
    title: 'Trạng thái',
    key: 'status',
    render: (r) => h(NTag, { bordered: false, type: stayStatusLabel[r.status]?.type }, { default: () => stayStatusLabel[r.status]?.label }),
  },
]

async function load() {
  loading.value = true
  try {
    const [r, res, ci] = await Promise.all([
      get<Room[]>('/rooms'),
      get<Paged<RoomStay>>('/room-stays', { status: 'reserved', limit: 10 }),
      get<Paged<RoomStay>>('/room-stays', { status: 'checked_in', limit: 10 }),
    ])
    rooms.value = r
    reserved.value = res
    checkedIn.value = ci
  } catch (e) {
    message.error(errorText(e))
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.room-dot.available { background: #2f8f6b; }
.room-dot.reserved { background: #3b6fd1; }
.room-dot.out_of_order, .room-dot.inactive { background: #9aa3ad; }
</style>
