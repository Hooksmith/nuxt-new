import { randomBytes, timingSafeEqual } from 'node:crypto'

export function generateCsrfToken(): string {
  return randomBytes(32).toString('base64url')
}

/** Constant-time comparison so the token can't be guessed byte-by-byte. */
export function csrfTokensMatch(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}
