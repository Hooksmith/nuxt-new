import type { H3Event } from 'h3'
import type { z } from 'zod'
import { issuesToFieldErrors } from '#contracts'

function validationError(issues: z.core.$ZodIssue[]) {
  return createError({
    statusCode: 422,
    statusMessage: 'Unprocessable Entity',
    data: { code: 'VALIDATION_FAILED', fieldErrors: issuesToFieldErrors(issues) },
  })
}

/** Never trust the client: every body is re-validated with the same Zod contract the form used. */
export async function validateBody<TSchema extends z.ZodType>(
  event: H3Event,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  const result = await schema.safeParseAsync(await readBody(event))
  if (!result.success) throw validationError(result.error.issues)
  return result.data
}

export async function validateQuery<TSchema extends z.ZodType>(
  event: H3Event,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  const result = await schema.safeParseAsync(getQuery(event))
  if (!result.success) throw validationError(result.error.issues)
  return result.data
}

export function notFound(what = 'Resource') {
  return createError({ statusCode: 404, statusMessage: `${what} not found`, data: { code: 'NOT_FOUND' } })
}
