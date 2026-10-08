export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await simulateLatency()
  const score = getCreditScore(user.id)
  if (!score) throw notFound('Credit score')
  return score
})
