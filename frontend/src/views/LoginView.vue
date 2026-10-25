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
        <h2>Sign in to your workspace</h2>
        <p class="muted">Use any values for now. Authentication will be added later.</p>

        <n-form class="login-form" @submit.prevent="handleLogin">
          <n-form-item label="Email">
            <n-input v-model:value="form.email" size="large" placeholder="you@hotel.com" />
          </n-form-item>
          <n-form-item label="Password">
            <n-input
              v-model:value="form.password"
              size="large"
              type="password"
              show-password-on="click"
              placeholder="Enter your password"
            />
          </n-form-item>
          <n-button type="primary" size="large" block attr-type="submit">
            Continue to dashboard
          </n-button>
        </n-form>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NForm, NFormItem, NInput } from 'naive-ui'

const router = useRouter()
const form = reactive({
  email: '',
  password: '',
})

const handleLogin = () => {
  router.push('/dashboard')
}
</script>
