/**
 * Global route guard shared by every zone. Pages opt out with
 * `definePageMeta({ public: true })`.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  if (!auth.checked) await auth.fetchMe()

  if (to.meta.public) return

  if (!auth.isAuthenticated) {
    const { href, currentZone, navigate } = useZoneLink()
    const redirect = encodeURIComponent(href(currentZone, to.fullPath))
    return navigate('shell', `/login?redirect=${redirect}`)
  }
})

declare module '#app' {
  interface PageMeta {
    public?: boolean
  }
}
