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
          <span>{{ roleLabel }}</span>
        </div>
      </div>
      <n-menu :value="route.path" :options="menuOptions" @update:value="(key: string) => router.push(key)" />
    </n-layout-sider>

    <n-layout>
      <n-layout-header bordered class="pms-header">
        <div>
          <p class="header-kicker">{{ kicker }}</p>
          <h1>{{ title }}</h1>
        </div>
        <div class="header-actions">
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
import { NAvatar, NButton, NLayout, NLayoutContent, NLayoutHeader, NLayoutSider, NMenu } from 'naive-ui'
import { PAGE_ORDER, useAuthStore } from '../stores/auth'
import { pageLabel, roleLabels } from '../utils/format'

const props = defineProps<{ title: string; kicker?: string }>()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const collapsed = ref(false)

const kicker = computed(() => props.kicker ?? 'HOTEL PMS')
const initial = computed(() => (auth.user?.displayName || auth.user?.username || '?').charAt(0).toUpperCase())
const roleLabel = computed(() => roleLabels[auth.user?.role ?? 'staff'])

// Only the pages configured for the role (backend role-access.json) are shown.
const menuOptions = computed<MenuOption[]>(() =>
  PAGE_ORDER.filter((p) => auth.canSee(p)).map((p) => ({ label: pageLabel[p], key: `/${p}` })),
)

function logout() {
  auth.logout()
  router.push('/login')
}
</script>
