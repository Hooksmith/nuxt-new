import { z } from 'zod'
import type { Money } from './common'

export const LOAN_STATUSES = ['submitted', 'under_review', 'approved', 'rejected', 'disbursed', 'withdrawn'] as const
export const loanStatusSchema = z.enum(LOAN_STATUSES)
export type LoanStatus = z.infer<typeof loanStatusSchema>

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected',
  disbursed: 'Disbursed',
  withdrawn: 'Withdrawn',
}

/** Allowed workflow transitions — enforced on the server, mirrored in the UI. */
export const LOAN_STATUS_TRANSITIONS: Record<LoanStatus, readonly LoanStatus[]> = {
  submitted: ['under_review', 'withdrawn'],
  under_review: ['approved', 'rejected', 'withdrawn'],
  approved: ['disbursed'],
  rejected: [],
  disbursed: [],
  withdrawn: [],
}

export function canTransition(from: LoanStatus, to: LoanStatus): boolean {
  return LOAN_STATUS_TRANSITIONS[from].includes(to)
}

export function isTerminalStatus(status: LoanStatus): boolean {
  return LOAN_STATUS_TRANSITIONS[status].length === 0
}

export const loanProductSchema = z.enum(['personal', 'home', 'auto', 'business'], {
  error: 'Select a loan product',
})
export type LoanProduct = z.infer<typeof loanProductSchema>

export interface LoanProductConfig {
  label: string
  annualRate: number
  minTermMonths: number
  maxTermMonths: number
  maxAmount: number
}

export const LOAN_PRODUCTS: Record<LoanProduct, LoanProductConfig> = {
  personal: { label: 'Personal loan', annualRate: 0.115, minTermMonths: 6, maxTermMonths: 60, maxAmount: 50_000 },
  home: { label: 'Home loan', annualRate: 0.075, minTermMonths: 60, maxTermMonths: 360, maxAmount: 500_000 },
  auto: { label: 'Auto loan', annualRate: 0.089, minTermMonths: 12, maxTermMonths: 84, maxAmount: 120_000 },
  business: { label: 'SME business loan', annualRate: 0.099, minTermMonths: 6, maxTermMonths: 120, maxAmount: 250_000 },
}

export interface LoanHistoryEntry {
  status: LoanStatus
  at: string
  note?: string
}

export interface Loan {
  id: string
  reference: string
  product: LoanProduct
  principal: Money
  annualRate: number
  termMonths: number
  monthlyPayment: Money
  outstanding: Money
  purpose: string
  status: LoanStatus
  createdAt: string
  updatedAt: string
  history: LoanHistoryEntry[]
}

export const loanListQuerySchema = z.object({
  status: z.union([loanStatusSchema, z.literal('all')]).default('all'),
})
export type LoanListQuery = z.input<typeof loanListQuerySchema>
export type LoanListFilters = z.output<typeof loanListQuerySchema>

export const loanStatusEventSchema = z.object({
  loanId: z.string(),
  reference: z.string(),
  previousStatus: loanStatusSchema,
  status: loanStatusSchema,
  at: z.string(),
})
export type LoanStatusEvent = z.infer<typeof loanStatusEventSchema>

/**
 * Standard annuity formula. Works in minor units and returns a rounded
 * integer so the client and server always agree on the repayment amount.
 */
export function monthlyPayment(principalMinor: number, annualRate: number, termMonths: number): number {
  if (principalMinor <= 0 || termMonths <= 0) return 0
  const r = annualRate / 12
  if (r === 0) return Math.round(principalMinor / termMonths)
  return Math.round((principalMinor * r) / (1 - (1 + r) ** -termMonths))
}
