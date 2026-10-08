import { joinURL } from 'ufo'
import { CSRF_COOKIE, CSRF_HEADER } from '#contracts'

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * Single, typed HTTP client for every zone:
 *  - client: same-origin `/api` (the ingress routes it to the BFF)
 *  - server: `apiOrigin` + `/api`, forwarding the customer's cookies
 *  - attaches the CSRF token to state-changing requests
 *  - turns 401s into a redirect to the login page
 */
export default defineNuxtPlugin({
  name: 'api',
  setup(nuxtApp) {
    const config = useRuntimeConfig()
    const forwardedHeaders = import.meta.server ? useRequestHeaders(['cookie', 'accept-language']) : {}
    const baseURL = import.meta.server ? joinURL(config.apiOrigin || '/', 'api') : '/api'

    const api = $fetch.create({
      baseURL,
      timeout: 15_000,
      retry: 0,
      credentials: 'same-origin',
      onRequest({ options }) {
        const headers = new Headers(options.headers)
        for (const [key, value] of Object.entries(forwardedHeaders)) {
          if (value) headers.set(key, value)
        }
        const method = (options.method ?? 'GET').toUpperCase()
        if (import.meta.client && UNSAFE_METHODS.has(method)) {
          const token = readCookie(CSRF_COOKIE)
          if (token) headers.set(CSRF_HEADER, token)
        }
        headers.set('accept', 'application/json')
        options.headers = headers
      },
      async onResponseError({ response, request }) {
        const isAuthProbe = String(request).includes('/auth/')
        if (import.meta.client && response.status === 401 && !isAuthProbe) {
          await nuxtApp.runWithContext(() => useAuthStore().handleSessionExpired())
        }
      },
    })

    return { provide: { api } }
  },
})
