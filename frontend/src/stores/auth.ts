import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { get, post, tokenStorage } from '../api/client'
import type { AuthUser, PageKey } from '../api/types'

/** Menu order; the first page a role can see is its home page. */
export const PAGE_ORDER: PageKey[] = ['dashboard', 'stays', 'customers', 'rooms', 'accounts', 'change-password']

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)

  /** Pages come from the backend role-access.json; the backend still enforces every API. */
  const canSee = (page: PageKey) => !!user.value?.pages.includes(page)
  const can = (permission: string) =>
    !!user.value && (user.value.permissions.includes('*') || user.value.permissions.includes(permission))
  const homePath = computed(() => {
    const first = PAGE_ORDER.find((p) => canSee(p))
    return first ? `/${first}` : '/change-password'
  })

  async function login(username: string, password: string) {
    const res = await post<{ accessToken: string; user: AuthUser }>('/auth/login', { username, password })
    tokenStorage.set(res.accessToken)
    user.value = res.user
  }

  /** Restores the user from a stored token; returns false when not signed in. */
  async function restore() {
    if (user.value) return true
    if (!tokenStorage.get()) return false
    try {
      user.value = await get<AuthUser>('/auth/me')
      return true
    } catch {
      logout()
      return false
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    await post('/auth/change-password', { currentPassword, newPassword })
  }

  function logout() {
    tokenStorage.set(null)
    user.value = null
  }

  return { user, canSee, can, homePath, login, restore, changePassword, logout }
})
