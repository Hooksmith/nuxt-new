import type { LoanStatusEvent } from '#contracts'

type Listener = (event: LoanStatusEvent) => void

const listeners = new Map<string, Set<Listener>>()

/**
 * In-process pub/sub for loan status changes. In production this would be a
 * message broker (Kafka/Redis) so every replica receives every event.
 */
export const loanEvents = {
  subscribe(userId: string, listener: Listener): () => void {
    const set = listeners.get(userId) ?? new Set()
    set.add(listener)
    listeners.set(userId, set)
    return () => {
      set.delete(listener)
      if (set.size === 0) listeners.delete(userId)
    }
  },
  publish(userId: string, event: LoanStatusEvent): void {
    listeners.get(userId)?.forEach((listener) => listener(event))
  },
  listenerCount(userId: string): number {
    return listeners.get(userId)?.size ?? 0
  },
}
