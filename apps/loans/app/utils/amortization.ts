import { monthlyPayment } from '#contracts'

export interface AmortizationRow {
  period: number
  payment: number
  principal: number
  interest: number
  balance: number
}

/**
 * Full repayment schedule in integer minor units. The final instalment absorbs
 * rounding so the balance always ends at exactly zero.
 */
export function amortizationSchedule(
  principalMinor: number,
  annualRate: number,
  termMonths: number,
): AmortizationRow[] {
  const payment = monthlyPayment(principalMinor, annualRate, termMonths)
  const rate = annualRate / 12
  const rows: AmortizationRow[] = []
  let balance = principalMinor

  for (let period = 1; period <= termMonths && balance > 0; period++) {
    const interest = Math.round(balance * rate)
    let principal = payment - interest
    if (period === termMonths || principal > balance) principal = balance
    balance -= principal
    rows.push({ period, payment: principal + interest, principal, interest, balance })
  }
  return rows
}

export function totalInterest(rows: AmortizationRow[]): number {
  return rows.reduce((sum, row) => sum + row.interest, 0)
}
