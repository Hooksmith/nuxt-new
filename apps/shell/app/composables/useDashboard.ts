import { useQuery } from '@tanstack/vue-query'
import type { CreditScore, Portfolio } from '#contracts'

export interface DashboardData {
  portfolio: Portfolio
  creditScore: Pick<CreditScore, 'current' | 'band' | 'updatedAt'>
}

/** One GraphQL round trip for every analytics widget on the dashboard. */
const DASHBOARD_QUERY = /* GraphQL */ `
  query Dashboard($months: Int!) {
    portfolio {
      totalBalanceUsd
      totalOutstandingUsd
      activeLoans
      pendingApplications
      cashflow(months: $months) {
        month
        inflow
        outflow
      }
      loanStatusBreakdown {
        status
        count
      }
    }
    creditScore {
      current
      band
      updatedAt
    }
  }
`

export function useDashboardQuery(months = 6) {
  const graphql = useGraphQL()
  const query = useQuery({
    queryKey: [...queryKeys.portfolio, { months }],
    queryFn: ({ signal }) => graphql<DashboardData>(DASHBOARD_QUERY, { months }, signal),
  })
  prefetchOnServer(query)
  return query
}
