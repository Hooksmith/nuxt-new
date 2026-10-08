import { loanApplicationSchema } from '#contracts'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const application = await validateBody(event, loanApplicationSchema)
  await simulateLatency(300, 700)

  const loan = createLoan(user.id, application)
  setResponseStatus(event, 201)
  return loan
})
