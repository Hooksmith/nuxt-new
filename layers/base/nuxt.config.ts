import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineNuxtConfig } from 'nuxt/config'

const resolveLocal = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const isDev = process.env.NODE_ENV !== 'production'

/**
 * Shared "platform" layer. Every zone (shell, loans, ...) extends it to get the
 * same design system, security headers, API client, auth guard and data layer.
 */
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',

  modules: ['@pinia/nuxt', 'nuxt-security'],

  css: [resolveLocal('./app/assets/css/main.css')],

  // Stores from this layer are auto-imported in every zone (zones keep their own app/stores too).
  imports: {
    dirs: [resolveLocal('./app/stores')],
  },

  alias: {
    '#contracts': resolveLocal('./shared/contracts'),
  },

  typescript: {
    strict: true,
  },

  runtimeConfig: {
    /** Server-only origin of the BFF/API, e.g. http://shell:3000 inside the cluster. Empty = same process. */
    apiOrigin: '',
    public: {
      /** Name of the zone this app represents — overridden by each app. */
      zone: 'shell',
      /** Base path of every zone, used to build cross-zone links. */
      zones: {
        shell: '/',
        loans: '/loans',
      },
      idleTimeoutMinutes: 10,
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      titleTemplate: '%s · Banking Portal',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'theme-color', content: '#1d4ed8' },
      ],
    },
  },

  routeRules: {
    // Immutable, hashed build assets: cache forever and don't count them against the rate limit.
    '/_nuxt/**': { security: { rateLimiter: false } },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  nitro: {
    compressPublicAssets: true,
  },

  /**
   * Security headers, CSP with per-request nonces, SRI, rate limiting and
   * request size limits. CSRF uses our own double-submit implementation
   * (see server/middleware/csrf-cookie.ts and the shell's csrf-verify.ts).
   */
  security: {
    strict: false,
    nonce: true,
    sri: true,
    csrf: false,
    // Console stripping relies on esbuild; with the oxc/rolldown toolchain we enforce `no-console` via ESLint instead.
    removeLoggers: false,
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'base-uri': ["'none'"],
        'connect-src': ["'self'", ...(isDev ? ['ws:', 'wss:'] : [])],
        'font-src': ["'self'", 'data:'],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'img-src': ["'self'", 'data:', 'blob:'],
        'object-src': ["'none'"],
        'script-src': ["'self'", "'strict-dynamic'", "'nonce-{{nonce}}'"],
        'script-src-attr': ["'none'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        // TLS is terminated at the ingress, which also redirects HTTP -> HTTPS.
        'upgrade-insecure-requests': false,
      },
      crossOriginEmbedderPolicy: isDev ? 'unsafe-none' : 'credentialless',
      referrerPolicy: 'strict-origin-when-cross-origin',
      strictTransportSecurity: { maxAge: 31_536_000, includeSubdomains: true },
      xFrameOptions: 'DENY',
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: [],
        'display-capture': [],
        fullscreen: [],
      },
    },
    // Per-IP limit at the app tier; the ingress/WAF applies coarser limits in front of it.
    rateLimiter: {
      tokensPerInterval: 1200,
      interval: 60_000,
    },
    requestSizeLimiter: {
      maxRequestSizeInBytes: 100_000,
      maxUploadFileRequestInBytes: 5_000_000,
    },
  },
})
