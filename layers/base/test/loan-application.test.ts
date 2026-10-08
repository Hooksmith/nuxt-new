import { describe, expect, it } from 'vitest'
import { issuesToFieldErrors, loanApplicationSchema, loanApplicationStepSchemas } from '#contracts'

const valid = {
  fullName: 'Dara Sok',
  email: 'dara@example.com',
  phone: '012 345 678',
  nationalId: '123456789',
  dateOfBirth: '1990-05-01',
  employmentStatus: 'employed',
  employerName: 'Acme Co.',
  monthlyIncome: '3000',
  product: 'personal',
  amount: '5000',
  termMonths: '24',
  purpose: 'Kitchen renovation',
  agreeTerms: true,
  consentCreditCheck: true,
}

function errorsFor(input: unknown) {
  const result = loanApplicationSchema.safeParse(input)
  return result.success ? {} : issuesToFieldErrors(result.error.issues)
}

describe('loanApplicationSchema', () => {
  it('accepts a valid application and coerces form strings to numbers', () => {
    const result = loanApplicationSchema.parse(valid)
    expect(result.amount).toBe(5000)
    expect(result.monthlyIncome).toBe(3000)
    expect(result.phone).toBe('012345678')
  })

  it('accepts +855 phone numbers', () => {
    expect(errorsFor({ ...valid, phone: '+855 12 345 678' })).toEqual({})
  })

  it.each([
    ['phone', '12345'],
    ['nationalId', '12AB'],
    ['email', 'not-an-email'],
    ['fullName', '<script>alert(1)</script>'],
  ])('rejects an invalid %s', (field, value) => {
    expect(errorsFor({ ...valid, [field]: value })).toHaveProperty(field)
  })

  it('rejects applicants under 18', () => {
    const recent = new Date()
    recent.setFullYear(recent.getFullYear() - 17)
    expect(errorsFor({ ...valid, dateOfBirth: recent.toISOString().slice(0, 10) })).toHaveProperty('dateOfBirth')
  })

  it('requires an employer when employed', () => {
    expect(errorsFor({ ...valid, employerName: '' })).toEqual({ employerName: 'Enter your employer or business name' })
    expect(errorsFor({ ...valid, employmentStatus: 'retired', employerName: '' })).toEqual({})
  })

  it('enforces product limits', () => {
    expect(errorsFor({ ...valid, amount: '60000', monthlyIncome: '100000' })).toHaveProperty('amount')
    expect(errorsFor({ ...valid, product: 'home', termMonths: '24', amount: '5000' })).toHaveProperty('termMonths')
  })

  it('rejects unaffordable loans (debt-to-income above 50%)', () => {
    const errors = errorsFor({ ...valid, monthlyIncome: '500', amount: '20000', termMonths: '12' })
    expect(errors.amount).toMatch(/more than 50% of your income/)
  })

  it('requires both consents', () => {
    expect(Object.keys(errorsFor({ ...valid, agreeTerms: false, consentCreditCheck: undefined }))).toEqual([
      'agreeTerms',
      'consentCreditCheck',
    ])
  })
})

describe('loanApplicationStepSchemas', () => {
  it('validates only the fields of the current step', () => {
    expect(loanApplicationStepSchemas.personal.safeParse(valid).success).toBe(true)
    expect(loanApplicationStepSchemas.personal.safeParse({ ...valid, amount: 'x' }).success).toBe(true)
  })

  it('checks affordability on the loan step using income from the previous step', () => {
    const result = loanApplicationStepSchemas.loan.safeParse({ ...valid, monthlyIncome: '500', amount: '20000' })
    expect(result.success).toBe(false)
  })
})
