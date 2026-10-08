/**
 * Banking-grade inactivity timeout: warns the customer one minute before the
 * session ends and signs them out automatically if they do not respond.
 */
export function useIdleLogout(options: { warningSeconds?: number } = {}) {
  const auth = useAuthStore()
  const config = useRuntimeConfig()
  const timeoutMs = Number(config.public.idleTimeoutMinutes) * 60_000
  const warningMs = (options.warningSeconds ?? 60) * 1000

  const warningVisible = ref(false)
  const secondsLeft = ref(Math.round(warningMs / 1000))

  let lastActivity = Date.now()
  let ticker: ReturnType<typeof setInterval> | undefined

  const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const

  function markActive() {
    if (!warningVisible.value) lastActivity = Date.now()
  }

  function staySignedIn() {
    lastActivity = Date.now()
    warningVisible.value = false
    // Touch the server so the sliding session is refreshed too.
    void auth.fetchMe()
  }

  function tick() {
    if (!auth.isAuthenticated) return
    const remaining = timeoutMs - (Date.now() - lastActivity)
    if (remaining <= 0) {
      warningVisible.value = false
      void auth.logout('idle')
    } else if (remaining <= warningMs) {
      warningVisible.value = true
      secondsLeft.value = Math.ceil(remaining / 1000)
    }
  }

  onMounted(() => {
    events.forEach((event) => window.addEventListener(event, markActive, { passive: true }))
    ticker = setInterval(tick, 1000)
  })

  onBeforeUnmount(() => {
    events.forEach((event) => window.removeEventListener(event, markActive))
    clearInterval(ticker)
  })

  return { warningVisible, secondsLeft, staySignedIn, signOut: () => auth.logout() }
}
