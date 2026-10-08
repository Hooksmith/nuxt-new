import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import type { Loan, LoanApplication } from '#contracts'

export function useSubmitLoanApplication() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (application: LoanApplication) => api<Loan>('/loans', { method: 'POST', body: application }),
    onSuccess: (loan) => {
      queryClient.setQueryData(queryKeys.loans.detail(loan.id), loan)
      void queryClient.invalidateQueries({ queryKey: queryKeys.loans.lists() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.portfolio })
    },
  })
}

/** Optimistic update: the UI flips to "Withdrawn" immediately and rolls back on failure. */
export function useWithdrawLoan(id: MaybeRefOrGetter<string>) {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api<Loan>(`/loans/${encodeURIComponent(toValue(id))}/withdraw`, { method: 'POST' }),
    onMutate: async () => {
      const key = queryKeys.loans.detail(toValue(id))
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Loan>(key)
      if (previous) queryClient.setQueryData<Loan>(key, { ...previous, status: 'withdrawn' })
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.loans.detail(toValue(id)), context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.loans.all }),
  })
}
