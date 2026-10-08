import { CSRF_COOKIE } from '#contracts'

/**
 * Issues the double-submit CSRF cookie on the first request from a browser.
 * It is readable by JS (not httpOnly) on purpose: the client echoes it back
 * in the `x-csrf-token` header, which a cross-site attacker cannot do.
 */
export default defineEventHandler((event) => {
  if (getCookie(event, CSRF_COOKIE)) return
  setCookie(event, CSRF_COOKIE, generateCsrfToken(), {
    path: '/',
    sameSite: 'strict',
    secure: !import.meta.dev,
    httpOnly: false,
  })
})
