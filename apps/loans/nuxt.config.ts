/**
 * Loans zone — an independently built and deployed micro-frontend that owns
 * everything under `/loans`. It shares the platform layer with the shell, so
 * it looks and behaves the same, but ships on its own release cadence.
 */
export default defineNuxtConfig({
  extends: ['../../layers/base'],

  devtools: { enabled: true },

  app: {
    // All pages and assets live under /loans so the ingress can route by path.
    baseURL: '/loans/',
  },

  runtimeConfig: {
    public: {
      zone: 'loans',
    },
  },

  $development: {
    runtimeConfig: {
      // Open the platform via the shell (http://localhost:3000/loans), which proxies this zone.
      apiOrigin: 'http://localhost:3000',
    },
    vite: {
      // The page is served through the shell's proxy, but the HMR socket connects to this server directly.
      server: { ws: { clientPort: 3001 } },
    },
  },
})
