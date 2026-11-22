<template>
  <PmsLayout title="Chi tiết lưu trú" kicker="ROOM STAY">
    <n-card v-if="stay" :bordered="false" class="detail-card">
      <template #header>
        <n-space align="center">
          <span>Phòng {{ stay.room?.roomNumber }}</span>
          <n-tag :type="stayStatusLabel[stay.status].type" :bordered="false">
            {{ stayStatusLabel[stay.status].label }}
          </n-tag>
        </n-space>
      </template>
      <template #header-extra>
        <n-button @click="loadDetail" :loading="loading">Tải lại</n-button>
      </template>

      <n-descriptions :column="2" label-placement="left" bordered>
        <n-descriptions-item label="Mã đặt phòng">{{ stay.reservationCode || '—' }}</n-descriptions-item>
        <n-descriptions-item label="Loại phòng">{{ stay.room?.roomType?.name || '—' }}</n-descriptions-item>
        <n-descriptions-item label="Bảng giá">
          {{ stay.ratePlan?.name || '—' }}
          <span v-if="stay.ratePlan">({{ pricingTypeLabel[stay.ratePlan.pricingType] }})</span>
        </n-descriptions-item>
        <n-descriptions-item label="Số khách">{{ stay.guestCount }}</n-descriptions-item>
        <n-descriptions-item label="Dự kiến">
          {{ fmtDateTime(stay.plannedCheckInAt) }} → {{ fmtDateTime(stay.plannedCheckOutAt) }}
        </n-descriptions-item>
        <n-descriptions-item label="Thực tế">
          {{ fmtDateTime(stay.actualCheckInAt) }} → {{ fmtDateTime(stay.actualCheckOutAt) }}
        </n-descriptions-item>
        <n-descriptions-item v-if="stay.notes" label="Ghi chú" :span="2">
          <span style="white-space: pre-line">{{ stay.notes }}</span>
        </n-descriptions-item>
      </n-descriptions>

      <n-space v-if="stay.status === 'reserved' || stay.status === 'checked_in'" class="actions">
        <n-button v-if="stay.status === 'reserved'" type="primary" :loading="saving" @click="changeStatus('check-in', 'Đã nhận phòng')">
          Nhận phòng
        </n-button>
      </n-space>

      <n-divider title-placement="left">Khách ({{ stay.guests?.length ?? 0 }})</n-divider>
      <n-empty v-if="!stay.guests?.length" description="Chưa có khách trong phòng" />
      <div v-else class="guest-list">
        <div v-for="guest in stay.guests" :key="guest.roomStayCustomerId" class="guest-row">
          <div>
            <strong>{{ guest.customer?.fullName || '(chưa có tên)' }}</strong>
            <span v-if="guest.customer?.phone" class="muted">{{ guest.customer.phone }}</span>
          </div>
          <n-tag v-if="guest.isPrimary" size="small" type="success" :bordered="false">Khách chính</n-tag>
        </div>
      </div>

      <n-divider title-placement="left">Hoá đơn</n-divider>
      <n-descriptions v-if="bill?.finalized" :column="1" label-placement="left" bordered>
        <n-descriptions-item label="Tổng cộng"><strong>{{ fmtMoney(bill.totalAmount) }}</strong></n-descriptions-item>
        <n-descriptions-item label="Thanh toán">
          <n-tag v-if="bill.isPaid" type="success" :bordered="false">
            Đã thanh toán ({{ paymentLabel(bill.paymentMethod) }}) · {{ fmtDateTime(bill.paidAt) }}
          </n-tag>
          <n-tag v-else type="warning" :bordered="false">Chưa thanh toán</n-tag>
        </n-descriptions-item>
      </n-descriptions>
      <n-descriptions v-else-if="bill?.preview" :column="1" label-placement="left" bordered>
        <n-descriptions-item label="Thời lượng">{{ bill.preview.durationMinutes }} phút</n-descriptions-item>
        <n-descriptions-item label="Tiền phòng tạm tính">{{ fmtMoney(bill.preview.roomAmount) }}</n-descriptions-item>
      </n-descriptions>
      <n-empty v-else description="Chưa có hóa đơn" />

      <n-button v-if="bill?.preview && stay.status === 'checked_in'" type="primary" :loading="saving" @click="openPaymentConfirm">
        Thanh toán &amp; trả phòng
      </n-button>

      <p v-if="bill?.finalized && !bill.isPaid" class="muted">Hóa đơn cũ chưa thanh toán. Vui lòng xử lý theo quy trình quản lý.</p>
    </n-card>
    <n-spin v-else-if="loading" size="large" />
    <n-result v-else status="404" title="Không tìm thấy phiên lưu trú" description="Phiên lưu trú không tồn tại hoặc đã bị xoá." />

    <n-modal v-model:show="paymentConfirmOpen" preset="card" title="Xác nhận thanh toán & trả phòng" style="width: 520px">
      <n-form label-placement="left" label-width="120">
        <n-form-item label="Phụ thu"><n-input-number v-model:value="finalize.surchargeAmount" :min="0" :step="10000" style="width: 100%" /></n-form-item>
        <n-descriptions :column="1" bordered class="payment-total">
          <n-descriptions-item label="Tổng thanh toán"><strong>{{ fmtMoney(paymentTotal) }}</strong></n-descriptions-item>
        </n-descriptions>
        <n-form-item label="Thanh toán">
          <n-radio-group v-model:value="paymentMethod">
            <n-radio value="cash">Tiền mặt</n-radio>
            <n-radio value="bank_transfer">Chuyển khoản</n-radio>
          </n-radio-group>
        </n-form-item>
      </n-form>
      <p class="muted">Sau khi xác nhận, hóa đơn sẽ được tạo ở trạng thái đã thanh toán và phòng sẽ chuyển sang đang dọn.</p>
      <n-space justify="end">
        <n-button @click="paymentConfirmOpen = false">Hủy</n-button>
        <n-button type="primary" :loading="saving" @click="checkoutAndPay">Xác nhận</n-button>
      </n-space>
    </n-modal>
  </PmsLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  NButton, NCard, NDescriptions, NDescriptionsItem, NDivider, NEmpty, NForm, NFormItem,
  NInputNumber, NModal, NRadio, NRadioGroup,
  NResult, NSpace, NSpin, NTag, useMessage,
} from 'naive-ui'
import PmsLayout from '../layouts/PmsLayout.vue'
import { errorText, get, post } from '../api/client'
import type { Bill, RoomStay } from '../api/types'
import { fmtDateTime, fmtMoney, pricingTypeLabel, stayStatusLabel } from '../utils/format'

const route = useRoute()
const message = useMessage()
const stay = ref<RoomStay | null>(null)
const bill = ref<Bill | null>(null)
const loading = ref(true)
const saving = ref(false)
const paymentMethod = ref<'cash' | 'bank_transfer'>('cash')
const paymentConfirmOpen = ref(false)
const finalize = ref({ discountAmount: 0, surchargeAmount: 0, penaltyAmount: 0, penaltyReason: '' })
const paymentTotal = computed(() => Number(bill.value?.preview?.roomAmount ?? 0) + (finalize.value.surchargeAmount ?? 0))
const paymentLabel = (method?: string) => method === 'bank_transfer' ? 'chuyển khoản' : 'tiền mặt'

async function loadDetail() {
  loading.value = true
  try {
    const id = String(route.params.stayId)
    const [stayResult, billResult] = await Promise.all([
      get<RoomStay>(`/room-stays/${id}`),
      get<Bill>(`/room-stays/${id}/bill`),
    ])
    stay.value = stayResult
    bill.value = billResult
  } catch (error) {
    stay.value = null
    message.error(errorText(error))
  } finally {
    loading.value = false
  }
}

async function changeStatus(action: 'check-in', successMessage: string) {
  if (!stay.value) return
  saving.value = true
  try {
    await post(`/room-stays/${stay.value.stayId}/${action}`)
    message.success(successMessage)
    await loadDetail()
  } catch (error) {
    message.error(errorText(error))
  } finally {
    saving.value = false
  }
}

function openPaymentConfirm() {
  finalize.value = { discountAmount: 0, surchargeAmount: 0, penaltyAmount: 0, penaltyReason: '' }
  paymentConfirmOpen.value = true
}

async function checkoutAndPay() {
  if (!stay.value) return
  saving.value = true
  try {
    await post(`/room-stays/${stay.value.stayId}/bill/checkout-and-pay`, {
      discountAmount: finalize.value.discountAmount,
      surchargeAmount: finalize.value.surchargeAmount,
      penaltyAmount: finalize.value.penaltyAmount,
      penaltyReason: finalize.value.penaltyReason.trim() || null,
    })
    message.success('Đã thanh toán và trả phòng')
    paymentConfirmOpen.value = false
    await loadDetail()
  } catch (error) {
    message.error(errorText(error))
  } finally {
    saving.value = false
  }
}

onMounted(loadDetail)
</script>

<style scoped>
.detail-card { max-width: 1180px; margin: 0 auto; }
.actions { margin-top: 16px; }
.guest-list { display: flex; flex-direction: column; gap: 8px; }
.guest-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 12px 14px; border: 1px solid #e7ece9; border-radius: 8px; background: #fbfdfc; }
.guest-row > div { display: flex; flex-direction: column; gap: 2px; }
.muted { color: #75837d; }
.payment-actions { margin-top: 16px; }
.payment-total { margin-bottom: 16px; }
</style>
