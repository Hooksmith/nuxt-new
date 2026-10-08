export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  // Sliding expiry: re-sealing the cookie extends the session while the customer is active.
  const session = await useBankSession(event)
  await session.update({})
  return { user }
})
