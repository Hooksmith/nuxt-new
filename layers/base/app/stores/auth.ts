import { defineStore } from 'pinia'
import type { LoginInput, User } from '#contracts'

/**
 * Client-side session state. The session itself lives in an httpOnly, sealed
 * cookie on the BFF — this store only holds the non-sensitive profile.
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const checked = ref(false)
  const isAuthenticated = computed(() => user.value !== null)

  async function fetchMe() {
    try {
      const response = await useApi()<{ user: User }>('/auth/me')
      user.value = response.user
    } catch (error) {
      if (errorStatus(error) !== 401) throw error
      user.value = null
    } finally {
      checked.value = true
    }
  }

  async function login(credentials: LoginInput) {
    const response = await useApi()<{ user: User }>('/auth/login', { method: 'POST', body: credentials })
    user.value = response.user
    checked.value = true
  }

  function clear() {
    user.value = null
    useNuxtApp().$queryClient.clear()
  }

  async function logout(reason?: 'idle' | 'expired') {
    await useApi()('/auth/logout', { method: 'POST' }).catch(() => undefined)
    clear()
    const query = reason ? `?reason=${reason}` : ''
    await useZoneLink().navigate('shell', `/login${query}`, { replace: true })
  }

  async function handleSessionExpired() {
    if (!user.value) return
    clear()
    const { href, currentZone, navigate } = useZoneLink()
    const redirect = encodeURIComponent(href(currentZone, useRoute().fullPath))
    await navigate('shell', `/login?reason=expired&redirect=${redirect}`, { replace: true })
  }

  return { user, checked, isAuthenticated, fetchMe, login, logout, clear, handleSessionExpired }
})
