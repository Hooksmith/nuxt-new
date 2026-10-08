import { fileURLToPath } from 'node:url'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

const contracts = fileURLToPath(new URL('../../layers/base/shared/contracts', import.meta.url))

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias: { '#contracts': contracts } },
        test: { name: 'shell:unit', include: ['test/unit/**/*.test.ts'], environment: 'node' },
      },
      await defineVitestProject({
        test: {
          name: 'shell:nuxt',
          include: ['test/nuxt/**/*.test.ts'],
          environment: 'nuxt',
          environmentOptions: { nuxt: { domEnvironment: 'happy-dom' } },
        },
      }),
    ],
    coverage: {
      provider: 'v8',
      include: ['app/**/*.{ts,vue}', 'server/**/*.ts'],
    },
  },
})
