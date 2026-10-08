import { describe, expect, it } from 'vitest'
import { loginSchema } from '#contracts'
import { formatMoney, formatMonth, formatPercent } from '../app/utils/format'
import { safeRedirect } from '../app/utils/safe-redirect'
import { zodTypedSchema } from '../app/utils/zod-typed-schema'
import { errorMessage, errorStatus, fieldErrorsFrom } from '../app/utils/api-error'
import { csrfTokensMatch, generateCsrfToken } from '../server/utils/csrf'

describe('formatMoney', () => {
  it('formats minor units', () => {
    expect(formatMoney({ amount: 123_456, currency: 'USD' })).toBe('$1,234.56')
    expect(formatMoney({ amount: -500, currency: 'USD' }, { signed: true })).toBe('-$5.00')
    expect(formatMoney({ amount: 500, currency: 'USD' }, { signed: true })).toBe('+$5.00')
  })

  it('formats riel without decimals', () => {
    expect(formatMoney({ amount: 410_000, currency: 'KHR' })).toMatch(/KHR\s?4,100/)
  })

  it('formats months and percentages', () => {
    expect(formatMonth('2026-03')).toBe('Mar 2026')
    expect(formatPercent(0.115, 2)).toBe('11.50%')
  })
})

describe('safeRedirect (open-redirect protection)', () => {
  it.each(['/accounts', '/loans/apply?step=2', '/'])('allows %s', (path) => {
    expect(safeRedirect(path)).toBe(path)
  })

  it.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    '/\r\nSet-Cookie:x',
    'accounts',
    undefined,
    ['/a'],
  ])('rejects %j', (value) => {
    expect(safeRedirect(value)).toBe('/')
  })

  it('uses the provided fallback', () => {
    expect(safeRedirect('//evil.example', '/login')).toBe('/login')
  })
})

describe('zodTypedSchema', () => {
  it('maps zod issues to vee-validate errors', async () => {
    const schema = zodTypedSchema(loginSchema)
    const result = await schema.parse({ email: 'bad', password: '' })
    expect(result.errors).toEqual([
      { path: 'email', errors: ['Enter a valid email address'] },
      { path: 'password', errors: ['Enter your password', 'Password must be at least 8 characters'] },
    ])
  })

  it('returns parsed output on success', async () => {
    const result = await zodTypedSchema(loginSchema).parse({ email: ' a@b.co ', password: 'longenough' })
    expect(result).toEqual({ value: { email: 'a@b.co', password: 'longenough' }, errors: [] })
  })
})

describe('api errors', () => {
  const fetchError = Object.assign(new Error('fail'), {
    statusCode: 422,
    data: { data: { code: 'VALIDATION_FAILED', fieldErrors: { amount: 'Too high' } } },
  })

  it('extracts status, field errors and a safe message', () => {
    expect(errorStatus(fetchError)).toBe(422)
    expect(fieldErrorsFrom(fetchError)).toEqual({ amount: 'Too high' })
    expect(errorMessage(fetchError)).toBe('Some details need your attention.')
    expect(errorMessage(new Error('internal stack'))).not.toContain('stack')
  })
})

describe('csrf tokens', () => {
  it('generates unguessable tokens and compares in constant time', () => {
    const token = generateCsrfToken()
    expect(token).toMatch(/^[\w-]{43}$/)
    expect(generateCsrfToken()).not.toBe(token)
    expect(csrfTokensMatch(token, token)).toBe(true)
    expect(csrfTokensMatch(token, `${token}x`)).toBe(false)
    expect(csrfTokensMatch(token, undefined)).toBe(false)
  })
})
