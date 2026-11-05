<template>
  <PmsLayout title="Khách hàng" kicker="GUESTS">
    <n-card :bordered="false">
      <n-space justify="space-between" style="margin-bottom: 12px">
        <n-input-group>
          <n-input v-model:value="search" placeholder="Tìm theo tên, SĐT, email, số giấy tờ" clearable style="width: 340px" @keyup.enter="load(1)" />
          <n-button @click="load(1)">Tìm</n-button>
        </n-input-group>
        <n-button type="primary" @click="openCreate">+ Thêm khách</n-button>
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
    <n-modal v-model:show="createModal" preset="card" title="Thêm khách hàng" style="width: 520px">
      <p class="muted" style="margin-top: 0">Mọi trường đều không bắt buộc.</p>
      <n-form label-placement="left" label-width="120">
        <n-form-item label="Họ tên"><n-input v-model:value="form.fullName" /></n-form-item>
        <n-form-item label="SĐT"><n-input v-model:value="form.phone" /></n-form-item>
        <n-form-item label="Email"><n-input v-model:value="form.email" /></n-form-item>
        <n-divider title-placement="left">Giấy tờ (tuỳ chọn)</n-divider>
        <n-form-item label="Loại"><n-select v-model:value="form.identityType" :options="identityTypes" /></n-form-item>
        <n-form-item label="Số"><n-input v-model:value="form.identityNumber" /></n-form-item>
        <n-form-item label="Quốc tịch"><n-input v-model:value="form.nationality" placeholder="VN" /></n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end"><n-button type="primary" :loading="saving" @click="create">Lưu</n-button></n-space>
      </template>
    </n-modal>

    <!-- Detail -->
    <n-drawer v-model:show="detailOpen" :width="520">
      <n-drawer-content v-if="detail" :title="detail.fullName || '(chưa có tên)'" closable>
        <n-form label-placement="left" label-width="90">
          <n-form-item label="Họ tên"><n-input v-model:value="edit.fullName" /></n-form-item>
          <n-form-item label="SĐT"><n-input v-model:value="edit.phone" /></n-form-item>
          <n-form-item label="Email"><n-input v-model:value="edit.email" /></n-form-item>
          <n-form-item label="Ghi chú"><n-input v-model:value="edit.notes" type="textarea" :rows="2" /></n-form-item>
        </n-form>
        <n-button type="primary" secondary :loading="saving" @click="saveEdit">Lưu thay đổi</n-button>

        <n-divider title-placement="left">Giấy tờ tuỳ thân</n-divider>
        <n-data-table :columns="identityColumns" :data="detail.identities ?? []" size="small" :bordered="false" />

        <n-divider title-placement="left">Thêm / thay giấy tờ</n-divider>
        <n-form label-placement="left" label-width="90">
          <n-form-item label="Loại"><n-select v-model:value="idForm.identityType" :options="identityTypes" /></n-form-item>
          <n-form-item label="Số"><n-input v-model:value="idForm.identityNumber" /></n-form-item>
          <n-form-item label="Quốc tịch"><n-input v-model:value="idForm.nationality" /></n-form-item>
          <n-form-item label="Thay cho">
            <n-select v-model:value="idForm.replacesIdentityId" :options="replaceOptions" clearable placeholder="(giấy tờ mới, không thay)" />
          </n-form-item>
        </n-form>
        <n-button :loading="saving" :disabled="!idForm.identityNumber" @click="addIdentity">Thêm giấy tờ</n-button>
      </n-drawer-content>
    </n-drawer>
  </PmsLayout>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import {
  NButton, NCard, NDataTable, NDivider, NDrawer, NDrawerContent, NForm, NFormItem, NInput, NInputGroup,
  NModal, NSelect, NSpace, NTag, useMessage,
} from 'naive-ui'
import PmsLayout from '../layouts/PmsLayout.vue'
import { errorText, get, patch, post } from '../api/client'
import type { Customer, CustomerIdentity, Paged } from '../api/types'

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const search = ref('')
const page = ref<Paged<Customer>>({ items: [], page: 1, limit: 20, total: 0 })

const pagination = computed(() => ({
  page: page.value.page,
  pageSize: page.value.limit,
  itemCount: page.value.total,
}))

const identityTypes = [
  { label: 'CCCD', value: 'citizen_id' },
  { label: 'Hộ chiếu', value: 'passport' },
  { label: 'Bằng lái', value: 'driver_license' },
]
const identityLabel = (t: string) => identityTypes.find((x) => x.value === t)?.label ?? t

const columns: DataTableColumns<Customer> = [
  { title: 'Họ tên', key: 'fullName', render: (r) => r.fullName || '(chưa có tên)' },
  { title: 'SĐT', key: 'phone' },
  { title: 'Email', key: 'email' },
  {
    title: 'Giấy tờ',
    key: 'identities',
    render: (r) => (r.identities ?? []).map((i) => `${identityLabel(i.identityType)} ${i.identityNumber}`).join(', '),
  },
  {
    title: '',
    key: 'actions',
    render: (r) => h(NButton, { size: 'small', onClick: () => openDetail(r.customerId) }, { default: () => 'Chi tiết' }),
  },
]

const identityColumns: DataTableColumns<CustomerIdentity> = [
  { title: 'Loại', key: 'identityType', render: (r) => identityLabel(r.identityType) },
  { title: 'Số', key: 'identityNumber' },
  { title: 'Quốc tịch', key: 'nationality' },
  {
    title: 'Trạng thái',
    key: 'status',
    render: (r) => h(NTag, { size: 'small', type: r.status === 'active' ? 'success' : 'default', bordered: false }, { default: () => r.status }),
  },
]

async function load(p = 1) {
  loading.value = true
  try {
    page.value = await get<Paged<Customer>>('/customers', { page: p, limit: 20, search: search.value.trim() || undefined })
  } catch (e) {
    message.error(errorText(e))
  } finally {
    loading.value = false
  }
}

const createModal = ref(false)
const form = reactive({ fullName: '', phone: '', email: '', identityType: 'citizen_id', identityNumber: '', nationality: 'VN' })
const orNull = (v: string) => (v.trim() ? v.trim() : null)

function openCreate() {
  Object.assign(form, { fullName: '', phone: '', email: '', identityNumber: '' })
  createModal.value = true
}

async function create() {
  saving.value = true
  try {
    const body: Record<string, unknown> = { fullName: orNull(form.fullName), phone: orNull(form.phone), email: orNull(form.email) }
    if (form.identityNumber.trim()) {
      body.identity = { identityType: form.identityType, identityNumber: form.identityNumber.trim(), nationality: orNull(form.nationality) }
    }
    await post('/customers', body)
    message.success('Đã thêm khách hàng')
    createModal.value = false
    await load(1)
  } catch (e) {
    message.error(errorText(e))
  } finally {
    saving.value = false
  }
}

const detailOpen = ref(false)
const detail = ref<Customer | null>(null)
const edit = reactive({ fullName: '', phone: '', email: '', notes: '' })
const idForm = reactive({ identityType: 'citizen_id', identityNumber: '', nationality: 'VN', replacesIdentityId: null as string | null })
const replaceOptions = computed(() =>
  (detail.value?.identities ?? [])
    .filter((i) => i.status === 'active')
    .map((i) => ({ label: `${identityLabel(i.identityType)} ${i.identityNumber}`, value: i.identityId })),
)

async function openDetail(id: string) {
  try {
    detail.value = await get<Customer>(`/customers/${id}`)
    Object.assign(edit, {
      fullName: detail.value.fullName ?? '', phone: detail.value.phone ?? '',
      email: detail.value.email ?? '', notes: detail.value.notes ?? '',
    })
    Object.assign(idForm, { identityNumber: '', replacesIdentityId: null })
    detailOpen.value = true
  } catch (e) {
    message.error(errorText(e))
  }
}

async function saveEdit() {
  if (!detail.value) return
  saving.value = true
  try {
    detail.value = await patch<Customer>(`/customers/${detail.value.customerId}`, {
      fullName: orNull(edit.fullName), phone: orNull(edit.phone), email: orNull(edit.email), notes: orNull(edit.notes),
    })
    message.success('Đã lưu')
    await load(page.value.page)
  } catch (e) {
    message.error(errorText(e))
  } finally {
    saving.value = false
  }
}

async function addIdentity() {
  if (!detail.value) return
  saving.value = true
  try {
    await post(`/customers/${detail.value.customerId}/identities`, {
      identityType: idForm.identityType,
      identityNumber: idForm.identityNumber.trim(),
      nationality: orNull(idForm.nationality),
      ...(idForm.replacesIdentityId ? { replacesIdentityId: idForm.replacesIdentityId } : {}),
    })
    message.success('Đã thêm giấy tờ')
    await openDetail(detail.value.customerId)
    await load(page.value.page)
  } catch (e) {
    message.error(errorText(e))
  } finally {
    saving.value = false
  }
}

onMounted(() => load(1))
</script>
