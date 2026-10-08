export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const account = getAccount(user.id, getRouterParam(event, 'id') ?? '')
  if (!account) throw notFound('Account')
  return account
})
