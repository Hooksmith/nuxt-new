// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import prettier from 'eslint-config-prettier'
import vueA11y from 'eslint-plugin-vuejs-accessibility'

export default createConfigForNuxt({
  features: { typescript: true, stylistic: false },
  dirs: { src: ['apps/shell/app', 'apps/loans/app', 'layers/base/app'] },
})
  .prepend({
    ignores: ['**/.nuxt/**', '**/.output/**', '**/coverage/**', 'playwright-report/**', 'test-results/**'],
  })
  .append(...vueA11y.configs['flat/recommended'])
  .append({
    name: 'bank/security-and-quality',
    rules: {
      // XSS: never render raw HTML; interpolation is auto-escaped by Vue.
      'vue/no-v-html': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // Sensitive data must not live in long-lived browser storage.
      'no-restricted-globals': [
        'error',
        {
          name: 'localStorage',
          message: 'Do not persist customer data in localStorage. Use the BFF or sessionStorage without PII.',
        },
      ],
      'vue/require-default-prop': 'off',
      'vuejs-accessibility/label-has-for': ['error', { required: { some: ['nesting', 'id'] } }],
    },
  })
  .append({
    name: 'bank/typescript',
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
      // Inline `type` specifiers + autofix can produce `import type { value }`; keep type imports separate.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
    },
  })
  .append(prettier)
