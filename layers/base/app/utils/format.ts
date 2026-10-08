import type { Currency, Money } from '#contracts'

const moneyFormatters = new Map<string, Intl.NumberFormat>()

function moneyFormatter(currency: Currency, signed: boolean) {
  const key = `${currency}:${signed}`
  let formatter = moneyFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: currency === 'KHR' ? 'code' : 'symbol',
      minimumFractionDigits: currency === 'KHR' ? 0 : 2,
      maximumFractionDigits: currency === 'KHR' ? 0 : 2,
      signDisplay: signed ? 'exceptZero' : 'auto',
    })
    moneyFormatters.set(key, formatter)
  }
  return formatter
}

/** Formats integer minor units, e.g. `{ amount: 123456, currency: 'USD' }` -> `$1,234.56`. */
export function formatMoney(money: Money, { signed = false }: { signed?: boolean } = {}): string {
  return moneyFormatter(money.currency, signed).format(money.amount / 100)
}

export function formatCompactUsd(minor: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(minor / 100)
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

// A fixed time zone keeps SSR and client output identical (no hydration mismatch).
const TIME_ZONE = 'Asia/Phnom_Penh'

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: TIME_ZONE }).format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: TIME_ZONE }).format(
    new Date(iso),
  )
}

/** `2026-03` -> `Mar 2026` */
export function formatMonth(month: string): string {
  const [year, m] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year!, m! - 1, 1)),
  )
}
