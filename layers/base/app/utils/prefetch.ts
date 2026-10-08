import { onServerPrefetch } from 'vue'

/**
 * Awaits a TanStack query during SSR so its data is serialised into the
 * Nuxt payload. Errors are swallowed here and surfaced by the query state.
 */
export function prefetchOnServer(query: { suspense: () => Promise<unknown> }): void {
  if (import.meta.server) {
    onServerPrefetch(() =>
      query.suspense().then(
        () => undefined,
        () => undefined,
      ),
    )
  }
}
