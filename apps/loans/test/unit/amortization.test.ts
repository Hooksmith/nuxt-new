import { describe, expect, it } from 'vitest'
import { monthlyPayment } from '#contracts'
import { amortizationSchedule, totalInterest } from '../../app/utils/amortization'

describe('amortizationSchedule', () => {
  it.each([
    [1_000_000, 0.12, 12],
    [8_500_000, 0.075, 240],
    [400_000, 0.115, 24],
    [123_457, 0.099, 7],
  ])('pays off %i over %i months to exactly zero', (principal, rate, term) => {
    const rows = amortizationSchedule(principal, rate, term)
    expect(rows).toHaveLength(term)
    expect(rows.at(-1)!.balance).toBe(0)
    expect(rows.reduce((sum, r) => sum + r.principal, 0)).toBe(principal)
    // Every instalment except the last is the advertised monthly payment.
    const payment = monthlyPayment(principal, rate, term)
    expect(rows.slice(0, -1).every((r) => r.payment === payment)).toBe(true)
  })

  it('front-loads interest', () => {
    const rows = amortizationSchedule(1_000_000, 0.12, 12)
    expect(rows[0]!.interest).toBe(10_000)
    expect(rows[0]!.interest).toBeGreaterThan(rows.at(-1)!.interest)
    expect(totalInterest(rows)).toBe(rows.reduce((s, r) => s + r.payment, 0) - 1_000_000)
  })

  it('handles zero-interest loans', () => {
    const rows = amortizationSchedule(120_000, 0, 12)
    expect(totalInterest(rows)).toBe(0)
    expect(rows.every((r) => r.payment === 10_000)).toBe(true)
  })
})
