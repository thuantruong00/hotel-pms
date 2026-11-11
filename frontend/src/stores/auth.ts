import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { get, post, tokenStorage } from '../api/client'
import type { AuthUser, WorkSession } from '../api/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const session = ref<WorkSession | null>(null)
  const isManager = computed(() => user.value?.role === 'manager' || user.value?.role === 'admin')
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(username: string, password: string) {
    const res = await post<{ accessToken: string; user: AuthUser }>('/auth/login', { username, password })
    tokenStorage.set(res.accessToken)
    user.value = res.user
    await loadSession()
  }

  /** Restores the user from a stored token; returns false when not signed in. */
  async function restore() {
    if (user.value) return true
    if (!tokenStorage.get()) return false
    try {
      user.value = await get<AuthUser>('/auth/me')
      await loadSession()
      return true
    } catch {
      logout()
      return false
    }
  }

  async function loadSession() {
    session.value = await get<WorkSession | null>('/work-sessions/current')
  }

  async function openSession() {
    session.value = await post<WorkSession>('/work-sessions/open')
  }

  async function closeSession() {
    if (!session.value) return
    await post(`/work-sessions/${session.value.sessionId}/close`)
    session.value = null
  }

  function logout() {
    tokenStorage.set(null)
    user.value = null
    session.value = null
  }

  return { user, session, isManager, isAdmin, login, restore, loadSession, openSession, closeSession, logout }
})
