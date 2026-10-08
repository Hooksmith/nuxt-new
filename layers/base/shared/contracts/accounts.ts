import { z } from 'zod'
import { paginationQuerySchema, type Money } from './common'

export const accountTypeSchema = z.enum(['checking', 'savings', 'term_deposit'])
export type AccountType = z.infer<typeof accountTypeSchema>

export interface Account {
  id: string
  name: string
  type: AccountType
  /** Only the masked number ever leaves the server. */
  maskedNumber: string
  balance: Money
  availableBalance: Money
  status: 'active' | 'frozen'
  openedAt: string
}

export const transactionTypeSchema = z.enum(['credit', 'debit'])
export type TransactionType = z.infer<typeof transactionTypeSchema>

export interface Transaction {
  id: string
  accountId: string
  type: TransactionType
  amount: Money
  description: string
  category: string
  counterparty: string
  status: 'posted' | 'pending'
  bookedAt: string
}

export const transactionQuerySchema = paginationQuerySchema.extend({
  type: z.enum(['all', 'credit', 'debit']).default('all'),
  search: z.string().trim().max(64).default(''),
})
export type TransactionQuery = z.input<typeof transactionQuerySchema>
export type TransactionFilters = z.output<typeof transactionQuerySchema>

/** Masks all but the last four digits: `0012 3456 7890` -> `•••• 7890`. */
export function maskAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, '')
  if (digits.length <= 4) return '••••'
  return `•••• ${digits.slice(-4)}`
}
