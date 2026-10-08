import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { Account, CreditScore, Paginated, Transaction, TransactionQuery } from '#contracts'

export function useAccountsQuery() {
  const api = useApi()
  const query = useQuery({
    queryKey: queryKeys.accounts.list(),
    queryFn: ({ signal }) => api<Account[]>('/accounts', { signal }),
  })
  prefetchOnServer(query)
  return query
}

export function useAccountQuery(id: MaybeRefOrGetter<string>) {
  const api = useApi()
  const query = useQuery({
    queryKey: computed(() => queryKeys.accounts.detail(toValue(id))),
    queryFn: ({ signal }) => api<Account>(`/accounts/${encodeURIComponent(toValue(id))}`, { signal }),
  })
  prefetchOnServer(query)
  return query
}

export function useTransactionsQuery(id: MaybeRefOrGetter<string>, filters: MaybeRefOrGetter<TransactionQuery>) {
  const api = useApi()
  const query = useQuery({
    queryKey: computed(() => queryKeys.accounts.transactions(toValue(id), toValue(filters))),
    queryFn: ({ signal }) =>
      api<Paginated<Transaction>>(`/accounts/${encodeURIComponent(toValue(id))}/transactions`, {
        query: toValue(filters),
        signal,
      }),
    // Keep showing the current page while the next one loads (no layout jump).
    placeholderData: keepPreviousData,
  })
  prefetchOnServer(query)
  return query
}

export function useCreditScoreQuery() {
  const api = useApi()
  const query = useQuery({
    queryKey: queryKeys.creditScore,
    queryFn: ({ signal }) => api<CreditScore>('/credit-score', { signal }),
    staleTime: 5 * 60_000,
  })
  prefetchOnServer(query)
  return query
}
