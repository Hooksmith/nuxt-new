import { canTransition } from '#contracts'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const loan = getLoan(user.id, getRouterParam(event, 'id') ?? '')
  if (!loan) throw notFound('Loan')
  if (!canTransition(loan.status, 'withdrawn')) {
    throw createError({ statusCode: 409, statusMessage: 'Conflict', data: { code: 'INVALID_TRANSITION' } })
  }
  await simulateLatency(300, 600)

  const result = transitionLoan(loan.id, 'withdrawn', 'Withdrawn by customer')
  loanEvents.publish(result.userId, result.event)
  return result.loan
})
