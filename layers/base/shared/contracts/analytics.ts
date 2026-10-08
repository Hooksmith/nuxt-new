import type { LoanStatus } from './loans'

export interface CashflowPoint {
  month: string
  inflow: number
  outflow: number
}

export interface LoanStatusCount {
  status: LoanStatus
  count: number
}

/** Shape returned by the `portfolio` GraphQL query (amounts are USD minor units). */
export interface Portfolio {
  totalBalanceUsd: number
  totalOutstandingUsd: number
  activeLoans: number
  pendingApplications: number
  cashflow: CashflowPoint[]
  loanStatusBreakdown: LoanStatusCount[]
}
