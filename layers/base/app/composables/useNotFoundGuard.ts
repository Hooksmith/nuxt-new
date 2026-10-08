import { onServerPrefetch, watch, type Ref } from 'vue'

/**
 * Turns a 404 from a TanStack query into a real 404 page — with the right HTTP
 * status during SSR (not a 200 with an empty page) and on client navigation.
 */
export function useNotFoundGuard(query: { error: Ref<unknown>; suspense: () => Promise<unknown> }, message: string) {
  if (import.meta.server) {
    onServerPrefetch(async () => {
      await query.suspense().catch(() => undefined)
      if (errorStatus(query.error.value) === 404) {
        throw createError({ statusCode: 404, statusMessage: message, fatal: true })
      }
    })
    return
  }
  watch(
    query.error,
    (error) => {
      if (errorStatus(error) === 404) showError({ statusCode: 404, statusMessage: message })
    },
    { immediate: true },
  )
}
