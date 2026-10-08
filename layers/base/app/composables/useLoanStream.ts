import { useQueryClient } from '@tanstack/vue-query'
import { LOAN_STATUS_LABELS, loanStatusEventSchema, type Loan, type LoanStatusEvent } from '#contracts'

type StreamState = 'connecting' | 'live' | 'reconnecting'

/**
 * Subscribes to real-time loan status changes over Server-Sent Events and
 * patches the TanStack Query cache in place, so every list, detail view and
 * chart updates without polling.
 */
export function useLoanStream(options: { onEvent?: (event: LoanStatusEvent) => void } = {}) {
  const queryClient = useQueryClient()
  const { polite } = useAnnouncer()
  const state = ref<StreamState>('connecting')
  const lastEvent = ref<LoanStatusEvent | null>(null)
  let source: EventSource | undefined

  function apply(event: LoanStatusEvent) {
    const patch = (loan: Loan): Loan =>
      loan.id === event.loanId
        ? {
            ...loan,
            status: event.status,
            updatedAt: event.at,
            history: [...loan.history, { status: event.status, at: event.at }],
          }
        : loan

    queryClient.setQueriesData<Loan[]>({ queryKey: queryKeys.loans.lists() }, (old) => old?.map(patch))
    queryClient.setQueryData<Loan>(queryKeys.loans.detail(event.loanId), (old) => (old ? patch(old) : old))
    // Filtered lists and aggregates are recomputed in the background.
    void queryClient.invalidateQueries({ queryKey: queryKeys.loans.lists(), refetchType: 'none' })
    void queryClient.invalidateQueries({ queryKey: queryKeys.portfolio })
  }

  onMounted(() => {
    source = new EventSource('/api/stream/loans', { withCredentials: true })
    source.addEventListener('open', () => (state.value = 'live'))
    source.addEventListener('error', () => (state.value = 'reconnecting'))
    source.addEventListener('loan-status', (message) => {
      const parsed = loanStatusEventSchema.safeParse(JSON.parse((message as MessageEvent<string>).data))
      if (!parsed.success) return
      lastEvent.value = parsed.data
      apply(parsed.data)
      options.onEvent?.(parsed.data)
      polite(`Loan ${parsed.data.reference} is now ${LOAN_STATUS_LABELS[parsed.data.status].toLowerCase()}.`)
    })
  })

  onBeforeUnmount(() => source?.close())

  return { state, lastEvent }
}
