import { afterEach, describe, expect, it, vi } from 'vitest'
import { readCookie } from '../app/utils/cookies'
import { errorMessage, errorStatus } from '../app/utils/api-error'
import { formatCompactUsd, formatDate, formatDateTime } from '../app/utils/format'
import { queryKeys } from '../app/utils/query-keys'

describe('queryKeys', () => {
  it('nests keys so a prefix invalidates every descendant', () => {
    const list = queryKeys.loans.list({ status: 'approved' })
    const detail = queryKeys.loans.detail('loan_1')
    expect(list.slice(0, queryKeys.loans.lists().length)).toEqual(queryKeys.loans.lists())
    expect(detail.slice(0, 1)).toEqual(queryKeys.loans.all)
    expect(queryKeys.accounts.transactions('acc_1', { page: 2 })).toEqual([
      'accounts',
      'transactions',
      'acc_1',
      { page: 2 },
    ])
    expect(queryKeys.accounts.detail('acc_1')).toEqual(['accounts', 'detail', 'acc_1'])
    expect(queryKeys.accounts.list()).toEqual(['accounts', 'list'])
  })
})

describe('readCookie', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns undefined on the server', () => {
    expect(readCookie('XSRF-TOKEN')).toBeUndefined()
  })

  it('reads and decodes a cookie by exact name', () => {
    vi.stubGlobal('document', { cookie: 'XSRF-TOKEN-OLD=nope; XSRF-TOKEN=abc%2B123; theme=dark' })
    expect(readCookie('XSRF-TOKEN')).toBe('abc+123')
    expect(readCookie('missing')).toBeUndefined()
  })
})

describe('date formatting (fixed Asia/Phnom_Penh time zone for SSR/CSR parity)', () => {
  it('formats dates and times', () => {
    expect(formatDate('2026-03-01T20:00:00Z')).toBe('2 Mar 2026')
    expect(formatDateTime('2026-03-01T20:05:00Z')).toBe('2 Mar 2026, 03:05')
    expect(formatCompactUsd(1_250_000_00)).toBe('$1.3M')
  })
})

describe('errorMessage', () => {
  it.each([
    [401, /session has expired/],
    [403, /permission/],
    [404, /could not find/],
    [409, /changed by someone else/],
    [429, /Too many attempts/],
    [500, /Something went wrong/],
  ])('maps %i to a customer-safe message', (status, expected) => {
    const error = Object.assign(new Error('raw'), { response: { status } })
    expect(errorStatus(error)).toBe(status)
    expect(errorMessage(error)).toMatch(expected)
  })

  it('ignores values that are not fetch errors', () => {
    expect(errorStatus('boom')).toBeUndefined()
  })
})
