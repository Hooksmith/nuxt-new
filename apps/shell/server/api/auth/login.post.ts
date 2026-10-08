import { loginSchema } from '#contracts'

export default defineEventHandler(async (event) => {
  const { email, password } = await validateBody(event, loginSchema)
  await simulateLatency()

  const user = verifyCredentials(email, password)
  if (!user) {
    // Same response for unknown email and wrong password (no account enumeration).
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: { code: 'INVALID_CREDENTIALS' },
    })
  }

  const session = await useBankSession(event)
  await session.clear()
  await session.update({ userId: user.id, authenticatedAt: Date.now() })
  return { user }
})
