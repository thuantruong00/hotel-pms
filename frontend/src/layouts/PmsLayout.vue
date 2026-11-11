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
          <span>Lễ tân</span>
        </div>
      </div>
      <n-menu :value="route.path" :options="menuOptions" @update:value="(key: string) => router.push(key)" />
      <div class="sidebar-status">
        <span class="status-dot" :class="{ off: !auth.session }"></span>
        <span>{{ auth.session ? `Ca mở lúc ${fmtDateTime(auth.session.startedAt)}` : 'Chưa mở ca' }}</span>
      </div>
    </n-layout-sider>

    <n-layout>
      <n-layout-header bordered class="pms-header">
        <div>
          <p class="header-kicker">{{ kicker }}</p>
          <h1>{{ title }}</h1>
        </div>
        <div class="header-actions">
          <n-button v-if="!auth.session" type="primary" secondary :loading="busy" @click="toggleSession">
            Mở ca làm việc
          </n-button>
          <n-button v-else secondary :loading="busy" @click="toggleSession">Đóng ca</n-button>
          <n-avatar round color="#dfeee8">{{ initial }}</n-avatar>
          <div class="user-copy">
            <strong>{{ auth.user?.displayName || auth.user?.username }}</strong>
            <span>{{ roleLabel }}</span>
          </div>
          <n-button quaternary @click="logout">Đăng xuất</n-button>
        </div>
      </n-layout-header>

      <n-layout-content content-style="padding: 28px;">
        <slot />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import { NAvatar, NButton, NLayout, NLayoutContent, NLayoutHeader, NLayoutSider, NMenu, useMessage } from 'naive-ui'
import { useAuthStore } from '../stores/auth'
import { errorText } from '../api/client'
import { fmtDateTime } from '../utils/format'

const props = defineProps<{ title: string; kicker?: string }>()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const message = useMessage()
const collapsed = ref(false)
const busy = ref(false)

const kicker = computed(() => props.kicker ?? 'HOTEL PMS')
const initial = computed(() => (auth.user?.displayName || auth.user?.username || '?').charAt(0).toUpperCase())
const roleLabel = computed(() => ({ staff: 'Nhân viên', manager: 'Quản lý', admin: 'Quản trị' })[auth.user?.role ?? 'staff'])

const menuOptions: MenuOption[] = [
  { label: 'Tổng quan', key: '/dashboard' },
  { label: 'Đặt phòng / Lưu trú', key: '/stays' },
  { label: 'Khách hàng', key: '/customers' },
  { label: 'Phòng & giá', key: '/rooms' },
]

async function toggleSession() {
  busy.value = true
  try {
    if (auth.session) {
      await auth.closeSession()
      message.success('Đã đóng ca')
    } else {
      await auth.openSession()
      message.success('Đã mở ca')
    }
  } catch (e) {
    message.error(errorText(e))
  } finally {
    busy.value = false
  }
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.status-dot.off { background: #c47b22; }
</style>
