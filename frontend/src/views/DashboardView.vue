<template>
  <PmsLayout>
    <div class="dashboard-page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">TUESDAY, OCTOBER 23, 2026</p>
          <h2>Property overview</h2>
        </div>
        <n-button type="primary">+ New reservation</n-button>
      </div>

      <n-grid :cols="4" :x-gap="16" :y-gap="16" responsive="screen">
        <n-gi v-for="stat in stats" :key="stat.label">
          <n-card :bordered="false" class="stat-card">
            <p class="stat-label">{{ stat.label }}</p>
            <div class="stat-value">{{ stat.value }}</div>
            <span class="stat-change" :class="stat.tone">{{ stat.change }}</span>
          </n-card>
        </n-gi>
      </n-grid>

      <div class="dashboard-grid">
        <n-card :bordered="false" title="Today's reservations" class="reservation-card">
          <template #header-extra>
            <n-button text type="primary">View all</n-button>
          </template>
          <n-data-table :columns="columns" :data="reservations" :bordered="false" />
        </n-card>

        <n-card :bordered="false" title="Room status" class="room-card">
          <div v-for="room in rooms" :key="room.label" class="room-row">
            <div class="room-label">
              <span class="room-dot" :class="room.tone"></span>
              <span>{{ room.label }}</span>
            </div>
            <strong>{{ room.value }}</strong>
          </div>
          <n-button secondary block class="room-button">Open room board</n-button>
        </n-card>
      </div>
    </div>
  </PmsLayout>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NCard, NDataTable, NGi, NGrid, NTag } from 'naive-ui'
import PmsLayout from '../layouts/PmsLayout.vue'

type Reservation = {
  guest: string
  room: string
  stay: string
  status: 'Checked in' | 'Arriving' | 'Checked out'
}

const stats = [
  { label: 'Occupancy', value: '78%', change: '+6.4% vs last week', tone: 'positive' },
  { label: 'Arrivals today', value: '24', change: '8 rooms ready', tone: 'positive' },
  { label: 'Departures today', value: '18', change: '3 pending checkout', tone: 'neutral' },
  { label: 'Revenue today', value: '$12,840', change: '+12.8% vs yesterday', tone: 'positive' },
]

const reservations: Reservation[] = [
  { guest: 'Sofia Bennett', room: '402 · Deluxe King', stay: 'Oct 23 – Oct 26', status: 'Checked in' },
  { guest: 'Daniel Kim', room: '215 · Garden Twin', stay: 'Oct 23 – Oct 25', status: 'Arriving' },
  { guest: 'Maya Patel', room: '518 · Premium Suite', stay: 'Oct 22 – Oct 28', status: 'Checked in' },
  { guest: 'Oliver Chen', room: '108 · Standard Queen', stay: 'Oct 20 – Oct 23', status: 'Checked out' },
]

const statusColors: Record<Reservation['status'], string> = {
  'Checked in': '#2f8f6b',
  Arriving: '#c47b22',
  'Checked out': '#7c8796',
}

const columns: DataTableColumns<Reservation> = [
  { title: 'Guest', key: 'guest' },
  { title: 'Room', key: 'room' },
  { title: 'Stay', key: 'stay' },
  {
    title: 'Status',
    key: 'status',
    render: (row) => h(NTag, { bordered: false, color: { textColor: statusColors[row.status], color: `${statusColors[row.status]}18` } }, { default: () => row.status }),
  },
]

const rooms = [
  { label: 'Available', value: '18 rooms', tone: 'available' },
  { label: 'Occupied', value: '72 rooms', tone: 'occupied' },
  { label: 'Cleaning', value: '9 rooms', tone: 'cleaning' },
  { label: 'Maintenance', value: '3 rooms', tone: 'maintenance' },
]
</script>
