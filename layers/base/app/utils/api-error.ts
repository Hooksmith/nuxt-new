import type { ApiErrorData } from '#contracts'

/** Structural view of ofetch's FetchError carrying an h3 `createError` body. */
export interface ApiFetchError extends Error {
  statusCode?: number
  response?: { status: number }
  data?: { data?: ApiErrorData }
}

export function isFetchError(error: unknown): error is ApiFetchError {
  return error instanceof Error && ('statusCode' in error || 'response' in error)
}

export function errorStatus(error: unknown): number | undefined {
  if (!isFetchError(error)) return undefined
  return error.statusCode ?? error.response?.status
}

export function fieldErrorsFrom(error: unknown): Record<string, string> | undefined {
  return isFetchError(error) ? error.data?.data?.fieldErrors : undefined
}

/** Customer-safe message for any API failure. */
export function errorMessage(error: unknown): string {
  switch (errorStatus(error)) {
    case 401:
      return 'Your session has expired. Please sign in again.'
    case 403:
      return 'You do not have permission to do that.'
    case 404:
      return 'We could not find what you were looking for.'
    case 409:
      return 'This item was changed by someone else. Refresh and try again.'
    case 422:
      return 'Some details need your attention.'
    case 429:
      return 'Too many attempts. Please wait a minute and try again.'
    default:
      return 'Something went wrong on our side. Please try again.'
  }
}
