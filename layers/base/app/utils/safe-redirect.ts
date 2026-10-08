/**
 * Prevents open redirects: only same-origin, absolute paths are allowed.
 * Rejects protocol-relative (`//evil.com`), backslash tricks (`/\evil.com`),
 * schemes (`javascript:`) and control characters.
 */
export function safeRedirect(target: unknown, fallback = '/'): string {
  if (typeof target !== 'string' || target.length === 0 || target.length > 2048) return fallback
  if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) return fallback
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F\\]/.test(target)) return fallback
  try {
    const url = new URL(target, 'https://placeholder.invalid')
    if (url.origin !== 'https://placeholder.invalid') return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}
