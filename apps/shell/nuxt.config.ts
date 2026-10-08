export default defineNuxtConfig({
  extends: ['../../layers/base'],

  devtools: { enabled: true },

  runtimeConfig: {
    /** Seals the session cookie. Must be >= 32 chars. Set via NUXT_SESSION_PASSWORD. */
    sessionPassword: '',
    /**
     * Where to proxy `/loans/**` when there is no ingress in front of the apps
     * (local dev and docker compose). Leave empty in Kubernetes.
     */
    loansZoneUrl: '',
    /** Interval for the mock loan-workflow simulator that feeds the live stream. 0 disables it. */
    loanSimulatorIntervalMs: 8000,
    public: {
      zone: 'shell',
    },
  },

  routeRules: {
    '/api/**': { headers: { 'cache-control': 'no-store' } },
    // Assets of the proxied loans zone (local/compose only; Kubernetes routes them at the ingress).
    '/loans/_nuxt/**': { security: { rateLimiter: false } },
    // Brute-force protection on credentials.
    '/api/auth/login': { security: { rateLimiter: { tokensPerInterval: 10, interval: 60_000 } } },
  },

  $development: {
    runtimeConfig: {
      sessionPassword: 'dev-only-session-password-change-me-0123456789',
    },
    vite: {
      server: {
        // Dev multi-zone routing: Vite proxies the loans zone's pages and assets.
        // In production/compose the same job is done by server/middleware/zones.ts or the gateway.
        proxy: { '/loans': { target: 'http://localhost:3001' } },
      },
    },
  },
})
