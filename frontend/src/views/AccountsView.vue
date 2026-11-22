<template>
  <PmsLayout title="Tài khoản" kicker="ACCOUNTS">
    <n-alert v-if="auth.user?.role === 'root'" type="info" :show-icon="false" style="margin-bottom: 16px">
      Tài khoản root chỉ dùng để khởi tạo. Hãy tạo tài khoản <strong>Chủ khách sạn</strong> (super admin) rồi đăng nhập bằng tài khoản đó để vận hành.
    </n-alert>

    <n-card :bordered="false">
      <n-space justify="space-between" style="margin-bottom: 12px">
        <span class="muted">Bạn quản lý được các role: {{ assignableRoleText }}</span>
        <n-space>
          <n-button @click="load(page.page)">Tải lại</n-button>
          <n-button type="primary" :disabled="!assignableRoles.length" @click="openCreate">+ Tạo tài khoản</n-button>
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

    <!-- Create -->
    <n-modal v-model:show="createOpen" preset="card" title="Tạo tài khoản" style="width: 480px">
      <n-form label-placement="left" label-width="130">
        <n-form-item label="Tên đăng nhập">
          <n-input v-model:value="form.username" placeholder="vd: letan01" :input-props="{ autocomplete: 'off' }" />
        </n-form-item>
        <n-form-item label="Tên hiển thị"><n-input v-model:value="form.displayName" /></n-form-item>
        <n-form-item label="Role"><n-select v-model:value="form.role" :options="roleOptions" /></n-form-item>
        <n-form-item label="Mật khẩu">
          <n-input
            v-model:value="form.password"
            type="password"
            show-password-on="click"
            placeholder="Tối thiểu 8 ký tự"
            :input-props="{ autocomplete: 'new-password' }"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end"><n-button type="primary" :loading="saving" @click="create">Tạo</n-button></n-space>
      </template>
    </n-modal>

    <!-- Edit -->
    <n-modal v-model:show="editOpen" preset="card" :title="`Sửa tài khoản ${editing?.username ?? ''}`" style="width: 480px">
      <n-form label-placement="left" label-width="130">
        <n-form-item label="Tên hiển thị"><n-input v-model:value="edit.displayName" /></n-form-item>
        <n-form-item label="Role"><n-select v-model:value="edit.role" :options="roleOptions" /></n-form-item>
        <n-form-item label="Trạng thái"><n-select v-model:value="edit.status" :options="statusOptions" /></n-form-item>
        <n-form-item label="Đặt lại mật khẩu">
          <n-input
            v-model:value="edit.password"
            type="password"
            show-password-on="click"
            placeholder="Để trống nếu không đổi"
            :input-props="{ autocomplete: 'new-password' }"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end"><n-button type="primary" :loading="saving" @click="saveEdit">Lưu</n-button></n-space>
      </template>
    </n-modal>
  </PmsLayout>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import {
  NAlert, NButton, NCard, NDataTable, NForm, NFormItem, NInput, NModal, NSelect, NSpace, NTag, useMessage,
} from 'naive-ui'
import PmsLayout from '../layouts/PmsLayout.vue'
import { errorText, get, patch, post } from '../api/client'
import type { Account, Paged, Role } from '../api/types'
import { roleLabels } from '../utils/format'
import { useAuthStore } from '../stores/auth'

type AccountPage = Paged<Account> & { assignableRoles: Role[] }

const auth = useAuthStore()
const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const page = ref<AccountPage>({ items: [], page: 1, limit: 20, total: 0, assignableRoles: [] })
const assignableRoles = computed(() => page.value.assignableRoles)
const assignableRoleText = computed(() => assignableRoles.value.map((r) => roleLabels[r]).join(', ') || '—')
const pagination = computed(() => ({ page: page.value.page, pageSize: page.value.limit, itemCount: page.value.total }))

const roleOptions = computed(() => assignableRoles.value.map((r) => ({ value: r, label: roleLabels[r] })))
const statusLabel: Record<string, string> = { active: 'Hoạt động', inactive: 'Ngưng', locked: 'Khoá' }
const statusOptions = Object.entries(statusLabel).map(([value, label]) => ({ value, label }))

const columns: DataTableColumns<Account> = [
  { title: 'Tên đăng nhập', key: 'username' },
  { title: 'Tên hiển thị', key: 'displayName' },
  { title: 'Role', key: 'role', render: (r) => roleLabels[r.role] },
  {
    title: 'Trạng thái',
    key: 'status',
    render: (r) =>
      h(NTag, { size: 'small', bordered: false, type: r.status === 'active' ? 'success' : 'warning' }, { default: () => statusLabel[r.status] }),
  },
  { title: '', key: 'edit', render: (r) => h(NButton, { size: 'small', onClick: () => openEdit(r) }, { default: () => 'Sửa' }) },
]

async function load(p = 1) {
  loading.value = true
  try {
    page.value = await get<AccountPage>('/users', { page: p, limit: 20 })
  } catch (e) {
    message.error(errorText(e))
  } finally {
    loading.value = false
  }
}

const createOpen = ref(false)
const form = reactive({ username: '', displayName: '', role: 'staff' as Role, password: '' })

function openCreate() {
  Object.assign(form, { username: '', displayName: '', password: '', role: assignableRoles.value.at(-1) ?? 'staff' })
  createOpen.value = true
}

async function create() {
  saving.value = true
  try {
    await post('/users', {
      username: form.username.trim(),
      displayName: form.displayName.trim() || null,
      role: form.role,
      password: form.password,
    })
    message.success('Đã tạo tài khoản')
    createOpen.value = false
    await load(1)
  } catch (e) {
    message.error(errorText(e))
  } finally {
    saving.value = false
  }
}

const editOpen = ref(false)
const editing = ref<Account | null>(null)
const edit = reactive({ displayName: '', role: 'staff' as Role, status: 'active' as Account['status'], password: '' })

function openEdit(a: Account) {
  editing.value = a
  Object.assign(edit, { displayName: a.displayName ?? '', role: a.role, status: a.status, password: '' })
  editOpen.value = true
}

async function saveEdit() {
  if (!editing.value) return
  saving.value = true
  try {
    await patch(`/users/${editing.value.userId}`, {
      displayName: edit.displayName.trim() || null,
      role: edit.role,
      status: edit.status,
      ...(edit.password ? { password: edit.password } : {}),
    })
    message.success('Đã lưu')
    editOpen.value = false
    await load(page.value.page)
  } catch (e) {
    message.error(errorText(e))
  } finally {
    saving.value = false
  }
}

onMounted(() => load(1))
</script>
