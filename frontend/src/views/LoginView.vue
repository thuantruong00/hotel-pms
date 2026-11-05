<template>
  <main class="login-page">
    <section class="login-visual">
      <div class="brand-mark">HP</div>
      <p class="eyebrow">HOTEL PMS</p>
      <h1>Run every stay<br />with confidence.</h1>
      <p class="visual-copy">
        A simple workspace for managing reservations, rooms, guests, and the
        daily rhythm of your property.
      </p>
      <div class="visual-footer">Property management workspace</div>
    </section>

    <section class="login-panel">
      <div class="login-card">
        <div class="mobile-brand">HOTEL PMS</div>
        <p class="eyebrow">WELCOME BACK</p>
        <h2>Đăng nhập</h2>
        <p class="muted">Dùng tài khoản nhân viên được cấp.</p>

        <n-alert v-if="error" type="error" :show-icon="false" style="margin-bottom: 16px">{{ error }}</n-alert>

        <n-form class="login-form" @submit.prevent="handleLogin">
          <n-form-item label="Tên đăng nhập">
            <n-input v-model:value="form.username" size="large" placeholder="admin" :input-props="{ autocomplete: 'username' }" />
          </n-form-item>
          <n-form-item label="Mật khẩu">
            <n-input
              v-model:value="form.password"
              size="large"
              type="password"
              show-password-on="click"
              placeholder="Nhập mật khẩu"
              :input-props="{ autocomplete: 'current-password' }"
            />
          </n-form-item>
          <n-button type="primary" size="large" block attr-type="submit" :loading="loading">
            Đăng nhập
          </n-button>
        </n-form>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NAlert, NButton, NForm, NFormItem, NInput } from 'naive-ui'
import { useAuthStore } from '../stores/auth'
import { errorText } from '../api/client'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const form = reactive({ username: '', password: '' })
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form.username.trim(), form.password)
    router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard')
  } catch (e) {
    error.value = errorText(e)
  } finally {
    loading.value = false
  }
}
</script>
