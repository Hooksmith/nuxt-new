import { describe, expect, it } from 'vitest'
import {
  LOAN_STATUSES,
  canTransition,
  creditBand,
  isTerminalStatus,
  maskAccountNumber,
  monthlyPayment,
} from '#contracts'

describe('monthlyPayment', () => {
  it('matches the standard annuity formula', () => {
    // $10,000 over 12 months at 12% p.a. = $888.49
    expect(monthlyPayment(1_000_000, 0.12, 12)).toBe(88_849)
  })

  it('handles zero interest and invalid input', () => {
    expect(monthlyPayment(120_000, 0, 12)).toBe(10_000)
    expect(monthlyPayment(0, 0.1, 12)).toBe(0)
    expect(monthlyPayment(1000, 0.1, 0)).toBe(0)
  })
})

describe('loan workflow', () => {
  it('allows the happy path', () => {
    expect(canTransition('submitted', 'under_review')).toBe(true)
    expect(canTransition('under_review', 'approved')).toBe(true)
    expect(canTransition('approved', 'disbursed')).toBe(true)
  })

  it('blocks invalid transitions', () => {
    expect(canTransition('submitted', 'disbursed')).toBe(false)
    expect(canTransition('approved', 'withdrawn')).toBe(false)
    expect(canTransition('rejected', 'approved')).toBe(false)
  })

  it('marks terminal statuses', () => {
    const terminal = LOAN_STATUSES.filter(isTerminalStatus)
    expect(terminal).toEqual(['rejected', 'disbursed', 'withdrawn'])
  })
})

describe('creditBand', () => {
  it.each([
    [300, 'Poor'],
    [579, 'Poor'],
    [580, 'Fair'],
    [700, 'Good'],
    [745, 'Very good'],
    [850, 'Excellent'],
  ] as const)('%i is %s', (score, band) => {
    expect(creditBand(score)).toBe(band)
  })
})

describe('maskAccountNumber', () => {
  it('keeps only the last four digits', () => {
    expect(maskAccountNumber('0012 3456 7890')).toBe('•••• 7890')
    expect(maskAccountNumber('123')).toBe('••••')
  })
})
