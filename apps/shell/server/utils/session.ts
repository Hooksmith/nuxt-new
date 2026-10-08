import type { H3Event } from 'h3'
import { SESSION_COOKIE, type User } from '#contracts'

interface SessionData {
  userId?: string
  authenticatedAt?: number
}

export const SESSION_TTL_SECONDS = 30 * 60

/**
 * Stateless, encrypted (iron-sealed) session cookie: httpOnly so XSS cannot
 * read it, SameSite=Lax + CSRF token for cross-site protection.
 */
export function useBankSession(event: H3Event) {
  const { sessionPassword } = useRuntimeConfig(event)
  return useSession<SessionData>(event, {
    name: SESSION_COOKIE,
    password: sessionPassword,
    maxAge: SESSION_TTL_SECONDS,
    sessionHeader: false,
    cookie: {
      httpOnly: true,
      secure: !import.meta.dev,
      sameSite: 'lax',
      path: '/',
    },
  })
}

export async function getSessionUser(event: H3Event): Promise<User | undefined> {
  const session = await useBankSession(event)
  return session.data.userId ? findUserById(session.data.userId) : undefined
}

export async function requireUser(event: H3Event): Promise<User> {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized', data: { code: 'UNAUTHENTICATED' } })
  }
  return user
}
