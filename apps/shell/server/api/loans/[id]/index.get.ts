export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const loan = getLoan(user.id, getRouterParam(event, 'id') ?? '')
  if (!loan) throw notFound('Loan')
  return loan
})
