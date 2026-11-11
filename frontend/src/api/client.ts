import axios, { AxiosError } from 'axios'

const TOKEN_KEY = 'pms.accessToken'

export const tokenStorage = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
  },
  set: (token: string | null) => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch { /* storage unavailable */ }
  },
}

export const http = axios.create({ baseURL: '/api' })

http.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let onUnauthorized: (() => void) | null = null
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn }

http.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      tokenStorage.set(null)
      onUnauthorized?.()
    }
    return Promise.reject(err)
  },
)

type ApiErrorBody = { error?: { code?: string; message?: string; details?: unknown } }

/** Turns an API error into "CODE: message" for display. */
export function errorText(err: unknown): string {
  const ax = err as AxiosError<ApiErrorBody>
  const e = ax?.response?.data?.error
  if (e) {
    const fieldErrors = collectFieldErrors(e.details)
    return `${e.code}: ${e.message}${fieldErrors ? ` (${fieldErrors})` : ''}`
  }
  return ax?.message || String(err)
}

// Flattens zod treeifyError output into "field: msg; ..."
function collectFieldErrors(details: unknown, path = ''): string {
  if (!details || typeof details !== 'object') return ''
  const d = details as { errors?: string[]; properties?: Record<string, unknown>; items?: unknown[] }
  const parts: string[] = []
  if (d.errors?.length) parts.push(`${path || 'body'}: ${d.errors.join(', ')}`)
  for (const [k, v] of Object.entries(d.properties ?? {})) {
    const p = collectFieldErrors(v, path ? `${path}.${k}` : k)
    if (p) parts.push(p)
  }
  ;(d.items ?? []).forEach((v, i) => {
    const p = collectFieldErrors(v, `${path}[${i}]`)
    if (p) parts.push(p)
  })
  return parts.join('; ')
}

/** Unwraps the `{ data, message }` envelope. */
export const get = async <T>(url: string, params?: object) =>
  (await http.get<{ data: T }>(url, { params })).data.data
export const post = async <T>(url: string, body: object = {}) =>
  (await http.post<{ data: T }>(url, body)).data.data
export const patch = async <T>(url: string, body: object) =>
  (await http.patch<{ data: T }>(url, body)).data.data
