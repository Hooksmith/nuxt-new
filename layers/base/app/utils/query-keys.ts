import type { LoanListQuery, TransactionQuery } from '#contracts'

/**
 * Central query-key factory — keeps cache keys consistent between zones and
 * lets mutations / live events invalidate precisely what changed.
 */
export const queryKeys = {
  portfolio: ['portfolio'] as const,
  creditScore: ['credit-score'] as const,
  accounts: {
    all: ['accounts'] as const,
    list: () => [...queryKeys.accounts.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.accounts.all, 'detail', id] as const,
    transactions: (id: string, query: TransactionQuery) =>
      [...queryKeys.accounts.all, 'transactions', id, query] as const,
  },
  loans: {
    all: ['loans'] as const,
    lists: () => [...queryKeys.loans.all, 'list'] as const,
    list: (query: LoanListQuery) => [...queryKeys.loans.lists(), query] as const,
    detail: (id: string) => [...queryKeys.loans.all, 'detail', id] as const,
  },
}
