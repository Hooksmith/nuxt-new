import { loanListQuerySchema } from '#contracts'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const query = await validateQuery(event, loanListQuerySchema)
  await simulateLatency()
  return listLoans(user.id, query)
})
