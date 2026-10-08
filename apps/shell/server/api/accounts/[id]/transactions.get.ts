import { transactionQuerySchema } from '#contracts'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const accountId = getRouterParam(event, 'id') ?? ''
  if (!getAccount(user.id, accountId)) throw notFound('Account')

  const query = await validateQuery(event, transactionQuerySchema)
  await simulateLatency()
  return listTransactions(user.id, accountId, query)
})
