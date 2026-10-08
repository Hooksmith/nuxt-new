import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { Loan, LoanListQuery } from '#contracts'

/** Server state for loans — shared by the shell dashboard and the loans zone. */
export function useLoansQuery(filters: MaybeRefOrGetter<LoanListQuery> = {}) {
  const api = useApi()
  const query = useQuery({
    queryKey: computed(() => queryKeys.loans.list(toValue(filters))),
    queryFn: ({ signal }) => api<Loan[]>('/loans', { query: toValue(filters), signal }),
    placeholderData: keepPreviousData,
  })
  prefetchOnServer(query)
  return query
}

export function useLoanQuery(id: MaybeRefOrGetter<string>) {
  const api = useApi()
  const query = useQuery({
    queryKey: computed(() => queryKeys.loans.detail(toValue(id))),
    queryFn: ({ signal }) => api<Loan>(`/loans/${encodeURIComponent(toValue(id))}`, { signal }),
  })
  prefetchOnServer(query)
  return query
}
