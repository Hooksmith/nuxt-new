export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await simulateLatency()
  return getCreditScore(user.id)
})
