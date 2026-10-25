<template>
  <n-layout has-sider class="pms-shell">
    <n-layout-sider
      bordered
      v-model:collapsed="collapsed"
      collapse-mode="width"
      :collapsed-width="76"
      :width="248"
      show-trigger
      content-style="padding: 20px 12px;"
    >
      <div class="sidebar-brand">
        <div class="brand-mark small">HP</div>
        <div class="sidebar-brand-copy">
          <strong>Hotel PMS</strong>
          <span>Operations</span>
        </div>
      </div>
      <n-menu
        v-model:value="activeKey"
        v-model:expanded-keys="expandedKeys"
        :options="menuOptions"
      />
      <div class="sidebar-status">
        <span class="status-dot"></span>
        <span>All systems operational</span>
      </div>
    </n-layout-sider>

    <n-layout>
      <n-layout-header bordered class="pms-header">
        <div>
          <p class="header-kicker">PROPERTY OVERVIEW</p>
          <h1>Good morning, Alex</h1>
        </div>
        <div class="header-actions">
          <n-button quaternary circle>?</n-button>
          <n-avatar round color="#dfeee8">A</n-avatar>
          <div class="user-copy">
            <strong>Alex Morgan</strong>
            <span>Administrator</span>
          </div>
        </div>
      </n-layout-header>

      <n-layout-content content-style="padding: 28px;">
        <slot />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import type { MenuOption } from 'naive-ui'
import { NAvatar, NButton, NLayout, NLayoutContent, NLayoutHeader, NLayoutSider, NMenu } from 'naive-ui'

const activeKey = ref('overview')
const collapsed = ref(false)
const expandedKeys = ref(['reservations', 'rooms'])
const menuOptions: MenuOption[] = [
  { label: 'Overview', key: 'overview' },
  {
    label: 'Reservations',
    key: 'reservations',
    children: [
      { label: 'All reservations', key: 'reservations-all' },
      { label: 'New reservation', key: 'reservations-new' },
      { label: 'Calendar', key: 'reservations-calendar' },
    ],
  },
  {
    label: 'Rooms',
    key: 'rooms',
    children: [
      { label: 'Room board', key: 'rooms-board' },
      { label: 'Room types', key: 'rooms-types' },
      { label: 'Maintenance', key: 'rooms-maintenance' },
    ],
  },
  { label: 'Guests', key: 'guests' },
  { label: 'Housekeeping', key: 'housekeeping' },
  { label: 'Reports', key: 'reports' },
  {
    label: () => h('span', { class: 'menu-section-label' }, 'MANAGEMENT'),
    key: 'management',
    disabled: true,
  },
  {
    label: 'Settings',
    key: 'settings',
    children: [
      { label: 'Property settings', key: 'settings-property' },
      { label: 'Staff and roles', key: 'settings-staff' },
    ],
  },
]
</script>
