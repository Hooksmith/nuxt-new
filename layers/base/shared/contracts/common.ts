import { z } from 'zod'

export const currencySchema = z.enum(['USD', 'KHR'])
export type Currency = z.infer<typeof currencySchema>

/**
 * Monetary values always travel as integer minor units (cents / riel * 100)
 * to avoid floating point rounding errors in balances and repayments.
 */
export const moneySchema = z.object({
  amount: z.number().int(),
  currency: currencySchema,
})
export type Money = z.infer<typeof moneySchema>

/** Indicative FX rate used to aggregate KHR balances into USD totals. */
export const KHR_PER_USD = 4100

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
})

export const emailField = z
  .string()
  .trim()
  .min(1, 'Enter your email address')
  .max(254, 'Email address is too long')
  .pipe(z.email('Enter a valid email address'))

/** Collapses Zod issues into `{ "path.to.field": "first message" }`. */
export function issuesToFieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.map(String).join('.') || '_form'
    errors[key] ??= issue.message
  }
  return errors
}

/** Shape of every error body returned by the BFF (`createError({ data })`). */
export interface ApiErrorData {
  code: string
  fieldErrors?: Record<string, string>
}
