<template>
  <PmsLayout title="Đổi mật khẩu" kicker="ACCOUNT">
    <n-card :bordered="false" style="max-width: 480px">
      <n-form label-placement="top" @submit.prevent="submit">
        <n-form-item label="Mật khẩu hiện tại">
          <n-input
            v-model:value="form.current"
            type="password"
            show-password-on="click"
            :input-props="{ autocomplete: 'current-password' }"
          />
        </n-form-item>
        <n-form-item label="Mật khẩu mới (tối thiểu 8 ký tự)">
          <n-input
            v-model:value="form.next"
            type="password"
            show-password-on="click"
            :input-props="{ autocomplete: 'new-password' }"
          />
        </n-form-item>
        <n-form-item label="Nhập lại mật khẩu mới">
          <n-input
            v-model:value="form.confirm"
            type="password"
            show-password-on="click"
            :input-props="{ autocomplete: 'new-password' }"
          />
        </n-form-item>
        <n-button type="primary" attr-type="submit" :loading="saving">Đổi mật khẩu</n-button>
      </n-form>
    </n-card>
  </PmsLayout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { NButton, NCard, NForm, NFormItem, NInput, useMessage } from 'naive-ui'
import PmsLayout from '../layouts/PmsLayout.vue'
import { errorText } from '../api/client'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const message = useMessage()
const saving = ref(false)
const form = reactive({ current: '', next: '', confirm: '' })

async function submit() {
  if (form.next.length < 8) return message.warning('Mật khẩu mới phải có ít nhất 8 ký tự')
  if (form.next !== form.confirm) return message.warning('Nhập lại mật khẩu mới không khớp')
  saving.value = true
  try {
    await auth.changePassword(form.current, form.next)
    message.success('Đã đổi mật khẩu')
    Object.assign(form, { current: '', next: '', confirm: '' })
  } catch (e) {
    message.error(errorText(e))
  } finally {
    saving.value = false
  }
}
</script>
