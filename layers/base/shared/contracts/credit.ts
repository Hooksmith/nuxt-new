export type CreditBand = 'Poor' | 'Fair' | 'Good' | 'Very good' | 'Excellent'

export const CREDIT_SCORE_MIN = 300
export const CREDIT_SCORE_MAX = 850

export function creditBand(score: number): CreditBand {
  if (score >= 800) return 'Excellent'
  if (score >= 740) return 'Very good'
  if (score >= 670) return 'Good'
  if (score >= 580) return 'Fair'
  return 'Poor'
}

export interface CreditScorePoint {
  month: string
  score: number
}

export interface CreditFactor {
  label: string
  impact: 'positive' | 'neutral' | 'negative'
  detail: string
}

export interface CreditScore {
  current: number
  band: CreditBand
  updatedAt: string
  history: CreditScorePoint[]
  factors: CreditFactor[]
}
