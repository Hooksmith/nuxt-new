import { QueryClient, VueQueryPlugin, dehydrate, hydrate, type DehydratedState } from '@tanstack/vue-query'

/**
 * TanStack Query with SSR: queries awaited during render are dehydrated into
 * the Nuxt payload and re-hydrated on the client, so there is no double fetch.
 */
export default defineNuxtPlugin({
  name: 'vue-query',
  dependsOn: ['api'],
  setup(nuxtApp) {
    const state = useState<DehydratedState | null>('vue-query', () => null)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          gcTime: 5 * 60_000,
          refetchOnWindowFocus: true,
          // Retry transient failures only — never 4xx.
          retry: (failureCount, error) => {
            const status = errorStatus(error)
            if (status && status >= 400 && status < 500) return false
            return failureCount < 2
          },
        },
        mutations: { retry: false },
      },
    })

    nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })

    if (import.meta.server) {
      nuxtApp.hooks.hook('app:rendered', () => {
        state.value = dehydrate(queryClient)
      })
    }

    if (import.meta.client && state.value) {
      hydrate(queryClient, state.value)
    }

    return { provide: { queryClient } }
  },
})
