import { z } from 'zod'
import { emailField } from './common'
import { LOAN_PRODUCTS, loanProductSchema, monthlyPayment } from './loans'

const NAME_RE = /^\p{L}[\p{L}\p{M}' .-]*$/u
/** Cambodian mobile/landline: 0XX XXX XXX(X) or +855 XX XXX XXX(X). */
const PHONE_RE = /^(\+855|0)[1-9]\d{7,8}$/
/** Max share of monthly income that can go to the new repayment. */
export const MAX_DEBT_TO_INCOME = 0.5

function isAdult(isoDate: string, today = new Date()): boolean {
  const dob = new Date(`${isoDate}T00:00:00Z`)
  const eighteenth = new Date(Date.UTC(dob.getUTCFullYear() + 18, dob.getUTCMonth(), dob.getUTCDate()))
  return eighteenth <= today
}

const personalShape = {
  fullName: z
    .string()
    .trim()
    .min(2, 'Enter your full name')
    .max(100, 'Name must be 100 characters or fewer')
    .regex(NAME_RE, 'Name can only contain letters, spaces, hyphens and apostrophes'),
  email: emailField,
  phone: z
    .string()
    .transform((value) => value.replace(/[\s-]/g, ''))
    .pipe(z.string().regex(PHONE_RE, 'Enter a Cambodian phone number, e.g. 012 345 678')),
  nationalId: z
    .string()
    .trim()
    .regex(/^\d{9,10}$/, 'National ID must be 9 or 10 digits'),
  dateOfBirth: z.iso.date('Enter a valid date of birth').refine((v) => isAdult(v), 'You must be at least 18 years old'),
}

const employmentShape = {
  employmentStatus: z.enum(['employed', 'self_employed', 'retired', 'unemployed'], {
    error: 'Select your employment status',
  }),
  employerName: z.string().trim().max(100, 'Must be 100 characters or fewer').default(''),
  monthlyIncome: z.coerce
    .number({ error: 'Enter your monthly income' })
    .positive('Monthly income must be greater than 0')
    .max(1_000_000, 'Enter a realistic monthly income'),
}

const loanShape = {
  product: loanProductSchema,
  amount: z.coerce
    .number({ error: 'Enter the loan amount' })
    .int('Enter a whole amount')
    .min(500, 'The minimum loan amount is $500'),
  termMonths: z.coerce.number({ error: 'Select a loan term' }).int().min(6, 'The minimum term is 6 months'),
  purpose: z
    .string()
    .trim()
    .min(10, 'Describe the purpose in at least 10 characters')
    .max(500, 'Purpose must be 500 characters or fewer'),
}

const consentShape = {
  agreeTerms: z.literal(true, { error: 'You must accept the terms and conditions' }),
  consentCreditCheck: z.literal(true, { error: 'You must consent to a credit bureau check' }),
}

type EmploymentValues = z.output<z.ZodObject<typeof employmentShape>>
type LoanValues = z.output<z.ZodObject<typeof loanShape>>

function refineEmployment(value: EmploymentValues, ctx: z.RefinementCtx) {
  const needsEmployer = value.employmentStatus === 'employed' || value.employmentStatus === 'self_employed'
  if (needsEmployer && !value.employerName) {
    ctx.addIssue({ code: 'custom', path: ['employerName'], message: 'Enter your employer or business name' })
  }
}

function refineLoan(value: LoanValues, ctx: z.RefinementCtx) {
  const product = LOAN_PRODUCTS[value.product]
  if (value.amount > product.maxAmount) {
    ctx.addIssue({
      code: 'custom',
      path: ['amount'],
      message: `${product.label} is limited to $${product.maxAmount.toLocaleString('en-US')}`,
    })
  }
  if (value.termMonths < product.minTermMonths || value.termMonths > product.maxTermMonths) {
    ctx.addIssue({
      code: 'custom',
      path: ['termMonths'],
      message: `${product.label} terms are ${product.minTermMonths}–${product.maxTermMonths} months`,
    })
  }
}

function refineAffordability(value: Pick<EmploymentValues, 'monthlyIncome'> & LoanValues, ctx: z.RefinementCtx) {
  const { annualRate } = LOAN_PRODUCTS[value.product]
  const repayment = monthlyPayment(value.amount * 100, annualRate, value.termMonths) / 100
  if (repayment > value.monthlyIncome * MAX_DEBT_TO_INCOME) {
    ctx.addIssue({
      code: 'custom',
      path: ['amount'],
      message: `The estimated repayment of $${repayment.toFixed(2)}/month is more than ${MAX_DEBT_TO_INCOME * 100}% of your income. Try a smaller amount or a longer term.`,
    })
  }
}

export const LOAN_APPLICATION_STEPS = ['personal', 'employment', 'loan', 'review'] as const
export type LoanApplicationStep = (typeof LOAN_APPLICATION_STEPS)[number]

/** Per-step schemas drive the wizard; each step only validates its own fields. */
export const loanApplicationStepSchemas = {
  personal: z.object(personalShape),
  employment: z.object(employmentShape).superRefine(refineEmployment),
  // Carries monthlyIncome (entered on the previous step) so affordability is checked where the amount is entered.
  loan: z.object({ ...loanShape, monthlyIncome: employmentShape.monthlyIncome }).superRefine((value, ctx) => {
    refineLoan(value, ctx)
    refineAffordability(value, ctx)
  }),
  review: z.object(consentShape),
} satisfies Record<LoanApplicationStep, z.ZodType>

/** Full schema — used for the final submit on the client and re-validated by the BFF. */
export const loanApplicationSchema = z
  .object({ ...personalShape, ...employmentShape, ...loanShape, ...consentShape })
  .superRefine((value, ctx) => {
    refineEmployment(value, ctx)
    refineLoan(value, ctx)
    refineAffordability(value, ctx)
  })

export type LoanApplicationInput = z.input<typeof loanApplicationSchema>
export type LoanApplication = z.output<typeof loanApplicationSchema>

/** Which step owns a field — used to send the user back to the right step on server errors. */
export const FIELD_STEP: Record<keyof LoanApplication, LoanApplicationStep> = {
  fullName: 'personal',
  email: 'personal',
  phone: 'personal',
  nationalId: 'personal',
  dateOfBirth: 'personal',
  employmentStatus: 'employment',
  employerName: 'employment',
  monthlyIncome: 'employment',
  product: 'loan',
  amount: 'loan',
  termMonths: 'loan',
  purpose: 'loan',
  agreeTerms: 'review',
  consentCreditCheck: 'review',
}

/** Fields that must never be persisted in browser storage. */
export const SENSITIVE_APPLICATION_FIELDS = [
  'nationalId',
  'dateOfBirth',
] as const satisfies readonly (keyof LoanApplication)[]
