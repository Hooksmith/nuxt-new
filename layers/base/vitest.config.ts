import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '#contracts': fileURLToPath(new URL('./shared/contracts', import.meta.url)) },
  },
  test: {
    name: 'base',
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['shared/**/*.ts', 'app/utils/**/*.ts', 'server/utils/**/*.ts'],
      // SSR-only hook wiring; exercised by the E2E suite against real server renders.
      exclude: ['app/utils/prefetch.ts'],
      thresholds: { lines: 80, functions: 80, branches: 75 },
    },
  },
})
