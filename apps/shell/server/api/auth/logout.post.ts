export default defineEventHandler(async (event) => {
  const session = await useBankSession(event)
  await session.clear()
  setResponseStatus(event, 204)
  return null
})
