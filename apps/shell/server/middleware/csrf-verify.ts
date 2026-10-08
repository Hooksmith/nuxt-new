import { CSRF_COOKIE, CSRF_HEADER } from '#contracts'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function forbidden(code: string) {
  return createError({ statusCode: 403, statusMessage: 'Forbidden', data: { code } })
}

/**
 * CSRF defence in depth for every state-changing API call:
 *  1. Origin header (when present) must match the host we are serving.
 *  2. Double-submit token: `x-csrf-token` header must equal the XSRF-TOKEN cookie.
 * Plus SameSite cookies, set in session.ts.
 */
export default defineEventHandler((event) => {
  if (SAFE_METHODS.has(event.method) || !event.path.startsWith('/api/')) return

  const origin = getRequestHeader(event, 'origin')
  if (origin) {
    let originHost: string | undefined
    try {
      originHost = new URL(origin).host
    } catch {
      throw forbidden('BAD_ORIGIN')
    }
    if (originHost !== getRequestHost(event, { xForwardedHost: true })) throw forbidden('BAD_ORIGIN')
  }

  if (!csrfTokensMatch(getCookie(event, CSRF_COOKIE), getRequestHeader(event, CSRF_HEADER))) {
    throw forbidden('CSRF_TOKEN_INVALID')
  }
})
