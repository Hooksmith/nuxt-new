import { describe, expect, it } from 'vitest'
import {
  DEMO_CREDENTIALS,
  TransitionError,
  createLoan,
  getAccount,
  getCreditScore,
  getLoan,
  getPortfolio,
  listAccounts,
  listLoans,
  listTransactions,
  transitionLoan,
  verifyCredentials,
} from '../../server/utils/db'

describe('mock core banking', () => {
  it('verifies credentials without leaking the password hash', () => {
    const user = verifyCredentials(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password)
    expect(user?.email).toBe(DEMO_CREDENTIALS.email)
    expect(user).not.toHaveProperty('passwordHash')
    expect(verifyCredentials(DEMO_CREDENTIALS.email, 'wrong-password')).toBeUndefined()
    expect(verifyCredentials('nobody@bank.test', DEMO_CREDENTIALS.password)).toBeUndefined()
  })

  it('only ever returns masked account numbers', () => {
    for (const account of listAccounts('usr_1')) {
      expect(account.maskedNumber).toMatch(/^•••• \d{4}$/)
      expect(account).not.toHaveProperty('number')
    }
  })

  it('scopes every lookup to the owner (IDOR protection)', () => {
    expect(getAccount('usr_1', 'acc_1')).toBeDefined()
    expect(getAccount('usr_2', 'acc_1')).toBeUndefined()
    expect(listAccounts('usr_2')).toEqual([])
    const [loan] = listLoans('usr_1')
    expect(getLoan('usr_2', loan!.id)).toBeUndefined()
  })

  it('paginates and filters transactions', () => {
    const page = listTransactions('usr_1', 'acc_1', { page: 1, pageSize: 10, type: 'debit', search: '' })
    expect(page.items).toHaveLength(10)
    expect(page.items.every((t) => t.type === 'debit')).toBe(true)
    expect(page.totalPages).toBe(Math.ceil(page.total / 10))

    const beyond = listTransactions('usr_1', 'acc_1', { page: 999, pageSize: 10, type: 'all', search: '' })
    expect(beyond.page).toBe(beyond.totalPages)

    const search = listTransactions('usr_1', 'acc_1', { page: 1, pageSize: 50, type: 'all', search: 'salary' })
    expect(search.items.every((t) => /salary/i.test(t.description + t.category))).toBe(true)
  })

  it('enforces the loan workflow', () => {
    const loan = createLoan('usr_1', {
      fullName: 'Dara Sok',
      email: 'dara@example.com',
      phone: '012345678',
      nationalId: '123456789',
      dateOfBirth: '1990-01-01',
      employmentStatus: 'employed',
      employerName: 'Acme',
      monthlyIncome: 3000,
      product: 'personal',
      amount: 5000,
      termMonths: 24,
      purpose: 'Kitchen renovation',
      agreeTerms: true,
      consentCreditCheck: true,
    })
    expect(loan.status).toBe('submitted')
    expect(loan.monthlyPayment.amount).toBeGreaterThan(0)

    const { event } = transitionLoan(loan.id, 'under_review')
    expect(event).toMatchObject({ loanId: loan.id, previousStatus: 'submitted', status: 'under_review' })
    expect(() => transitionLoan(loan.id, 'disbursed')).toThrow(TransitionError)
    expect(getLoan('usr_1', loan.id)?.history.map((h) => h.status)).toEqual(['submitted', 'under_review'])
  })

  it('aggregates the portfolio in USD', () => {
    const portfolio = getPortfolio('usr_1')
    expect(portfolio.totalBalanceUsd).toBeGreaterThan(0)
    const cashflow = portfolio.cashflow({ months: 3 })
    expect(cashflow).toHaveLength(3)
    expect(cashflow.every((p) => /^\d{4}-\d{2}$/.test(p.month))).toBe(true)
  })

  it('rebases the JSON snapshot so the data is always current', () => {
    const [latest] = listTransactions('usr_1', 'acc_1', { page: 1, pageSize: 5, type: 'all', search: '' }).items
    const ageHours = (Date.now() - Date.parse(latest!.bookedAt)) / 3_600_000
    expect(ageHours).toBeGreaterThanOrEqual(0)
    expect(ageHours).toBeLessThan(48)

    const thisMonth = new Date().toISOString().slice(0, 7)
    expect(getCreditScore('usr_1')?.history.at(-1)?.month).toBe(thisMonth)
    expect(getCreditScore('usr_unknown')).toBeUndefined()
  })
})
