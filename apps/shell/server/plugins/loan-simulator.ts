import { LOAN_STATUS_TRANSITIONS, type LoanStatus } from '#contracts'

/**
 * Simulates the bank's back-office workflow (underwriting, approvals,
 * disbursement) so the dashboard has real-time events to display.
 */
export default defineNitroPlugin((nitroApp) => {
  const interval = Number(useRuntimeConfig().loanSimulatorIntervalMs)
  if (!interval || import.meta.prerender) return

  const timer = setInterval(() => {
    const ids = activeLoanIds()
    if (ids.length === 0) {
      seedIncomingApplication()
      return
    }
    const id = ids[Math.floor(Math.random() * ids.length)]!
    const loan = listLoans('usr_1').find((l) => l.id === id)
    if (!loan) return
    const options = LOAN_STATUS_TRANSITIONS[loan.status].filter((s): s is LoanStatus => s !== 'withdrawn')
    const next = options[Math.random() < 0.8 ? 0 : options.length - 1]
    if (!next) return
    const { userId, event } = transitionLoan(id, next, 'Updated by back-office workflow')
    loanEvents.publish(userId, event)
  }, interval)
  timer.unref?.()

  nitroApp.hooks.hook('close', () => clearInterval(timer))
})
