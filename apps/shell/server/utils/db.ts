import { randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import mockData from '../data/mock-data.json'
import {
  KHR_PER_USD,
  LOAN_PRODUCTS,
  canTransition,
  maskAccountNumber,
  monthlyPayment,
  type Account,
  type CashflowPoint,
  type CreditScore,
  type Currency,
  type Loan,
  type LoanApplication,
  type LoanListFilters,
  type LoanProduct,
  type LoanStatus,
  type LoanStatusEvent,
  type Paginated,
  type Portfolio,
  type Transaction,
  type TransactionFilters,
  type User,
} from '#contracts'

/**
 * In-memory stand-in for the core banking system. The frontend never talks to
 * this directly — it goes through the BFF routes in `server/api`, exactly as
 * it would with a real backend.
 */

interface UserRecord extends User {
  passwordSalt: string
  passwordHash: string
}

interface AccountRecord extends Omit<Account, 'maskedNumber'> {
  userId: string
  number: string
}

interface LoanRecord extends Loan {
  userId: string
}

type TransactionRecord = Transaction & { userId: string }

interface SeedData {
  /** When the snapshot was taken; all timestamps are shifted relative to it on boot. */
  snapshotAt: string
  users: UserRecord[]
  accounts: AccountRecord[]
  transactions: TransactionRecord[]
  loans: LoanRecord[]
  creditScores: Record<string, CreditScore>
}

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 32).toString('hex')
}

export const DEMO_CREDENTIALS = { email: 'demo@bank.test', password: 'Password123!' } as const

// ---------------------------------------------------------------------------
// Seed data — loaded from server/data/mock-data.json (edit that file to change the demo).
// Timestamps are rebased so the newest data is always "today" and charts never go stale.
// ---------------------------------------------------------------------------

const seed = structuredClone(mockData) as unknown as SeedData
const now = new Date()
const shiftMs = now.getTime() - Date.parse(seed.snapshotAt)
const snapshot = new Date(seed.snapshotAt)
const shiftMonths =
  (now.getUTCFullYear() - snapshot.getUTCFullYear()) * 12 + (now.getUTCMonth() - snapshot.getUTCMonth())

const shiftDate = (iso: string) => new Date(Date.parse(iso) + shiftMs).toISOString()
const monthKey = (date: Date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
const shiftMonth = (key: string) => {
  const [year, month] = key.split('-').map(Number)
  return monthKey(new Date(Date.UTC(year!, month! - 1 + shiftMonths, 1)))
}

const users = seed.users
const accounts = seed.accounts
const transactions = seed.transactions.map((t) => ({ ...t, bookedAt: shiftDate(t.bookedAt) }))
const loans = seed.loans.map((l) => ({
  ...l,
  createdAt: shiftDate(l.createdAt),
  updatedAt: shiftDate(l.updatedAt),
  history: l.history.map((h) => ({ ...h, at: shiftDate(h.at) })),
}))
const creditScores = Object.fromEntries(
  Object.entries(seed.creditScores).map(([userId, score]) => [
    userId,
    {
      ...score,
      updatedAt: shiftDate(score.updatedAt),
      history: score.history.map((p) => ({ ...p, month: shiftMonth(p.month) })),
    },
  ]),
)

let loanSequence = Math.max(0, ...loans.map((l) => Number(l.reference.split('-').at(-1)) || 0))

function nextReference() {
  loanSequence += 1
  return `LN-${now.getUTCFullYear()}-${String(loanSequence).padStart(4, '0')}`
}

/** Builds a new application (used for customer submissions and the demo simulator). */
function buildLoan(
  userId: string,
  input: { product: LoanProduct; amount: number; termMonths: number; purpose: string },
): LoanRecord {
  const { annualRate } = LOAN_PRODUCTS[input.product]
  const principal = input.amount * 100
  const at = new Date().toISOString()
  return {
    id: `loan_${randomUUID().slice(0, 8)}`,
    userId,
    reference: nextReference(),
    product: input.product,
    principal: { amount: principal, currency: 'USD' },
    annualRate,
    termMonths: input.termMonths,
    monthlyPayment: { amount: monthlyPayment(principal, annualRate, input.termMonths), currency: 'USD' },
    outstanding: { amount: 0, currency: 'USD' },
    purpose: input.purpose,
    status: 'submitted',
    createdAt: at,
    updatedAt: at,
    history: [{ status: 'submitted', at }],
  }
}

// ---------------------------------------------------------------------------
// Queries (every lookup is scoped to the user to prevent IDOR)
// ---------------------------------------------------------------------------

export function findUserByEmail(email: string): User | undefined {
  return toUser(users.find((u) => u.email.toLowerCase() === email.toLowerCase()))
}

export function findUserById(id: string): User | undefined {
  return toUser(users.find((u) => u.id === id))
}

// Compared against a dummy hash for unknown emails so timing doesn't reveal which accounts exist.
const dummyHash = hashPassword('not-a-real-password', 'dummy-salt')

export function verifyCredentials(email: string, password: string): User | undefined {
  const record = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  const expected = Buffer.from(record?.passwordHash ?? dummyHash, 'hex')
  const actual = Buffer.from(hashPassword(password, record?.passwordSalt ?? 'dummy-salt'), 'hex')
  return timingSafeEqual(expected, actual) && record ? toUser(record) : undefined
}

function toUser(record: UserRecord | undefined): User | undefined {
  if (!record) return undefined
  const { passwordHash: _hash, passwordSalt: _salt, ...user } = record
  return user
}

function toAccount({ userId: _userId, number, ...rest }: AccountRecord): Account {
  return { ...rest, maskedNumber: maskAccountNumber(number) }
}

function toLoan({ userId: _userId, ...loan }: LoanRecord): Loan {
  return structuredClone(loan)
}

export function listAccounts(userId: string): Account[] {
  return accounts.filter((a) => a.userId === userId).map(toAccount)
}

export function getAccount(userId: string, accountId: string): Account | undefined {
  const record = accounts.find((a) => a.id === accountId && a.userId === userId)
  return record ? toAccount(record) : undefined
}

export function listTransactions(userId: string, accountId: string, query: TransactionFilters): Paginated<Transaction> {
  const search = query.search.toLowerCase()
  const filtered = transactions.filter(
    (t) =>
      t.userId === userId &&
      t.accountId === accountId &&
      (query.type === 'all' || t.type === query.type) &&
      (!search || t.description.toLowerCase().includes(search) || t.category.toLowerCase().includes(search)),
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / query.pageSize))
  const page = Math.min(query.page, totalPages)
  const items = filtered.slice((page - 1) * query.pageSize, page * query.pageSize).map(({ userId: _userId, ...t }) => t)
  return { items, page, pageSize: query.pageSize, total: filtered.length, totalPages }
}

export function listLoans(userId: string, query: LoanListFilters = { status: 'all' }): Loan[] {
  return loans
    .filter((l) => l.userId === userId && (query.status === 'all' || l.status === query.status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toLoan)
}

export function getLoan(userId: string, loanId: string): Loan | undefined {
  const record = loans.find((l) => l.id === loanId && l.userId === userId)
  return record ? toLoan(record) : undefined
}

export function createLoan(userId: string, application: LoanApplication): Loan {
  const record = buildLoan(userId, application)
  loans.push(record)
  return toLoan(record)
}

export class TransitionError extends Error {}

/** Applies a workflow transition and returns the event to broadcast. */
export function transitionLoan(
  loanId: string,
  to: LoanStatus,
  note?: string,
): { userId: string; event: LoanStatusEvent; loan: Loan } {
  const record = loans.find((l) => l.id === loanId)
  if (!record) throw new TransitionError('Loan not found')
  if (!canTransition(record.status, to)) throw new TransitionError(`Cannot move from ${record.status} to ${to}`)

  const at = new Date().toISOString()
  const previousStatus = record.status
  record.status = to
  record.updatedAt = at
  record.history.push({ status: to, at, note })
  if (to === 'disbursed') record.outstanding = { ...record.principal }

  return {
    userId: record.userId,
    loan: toLoan(record),
    event: { loanId: record.id, reference: record.reference, previousStatus, status: to, at },
  }
}

/** Loans the simulator may advance (anything not terminal and not waiting on the customer). */
export function activeLoanIds(): string[] {
  return loans.filter((l) => ['submitted', 'under_review', 'approved'].includes(l.status)).map((l) => l.id)
}

export function getCreditScore(userId: string): CreditScore | undefined {
  const score = creditScores[userId]
  return score ? structuredClone(score) : undefined
}

function toUsdMinor(amount: number, currency: Currency) {
  return currency === 'KHR' ? Math.round(amount / KHR_PER_USD) : amount
}

/** `cashflow` is a resolver function so GraphQL only computes it when the field is requested. */
export function getPortfolio(
  userId: string,
): Omit<Portfolio, 'cashflow'> & { cashflow: (args: { months?: number }) => CashflowPoint[] } {
  const userAccounts = accounts.filter((a) => a.userId === userId)
  const userLoans = loans.filter((l) => l.userId === userId)

  const breakdown = new Map<LoanStatus, number>()
  for (const loan of userLoans) breakdown.set(loan.status, (breakdown.get(loan.status) ?? 0) + 1)

  return {
    totalBalanceUsd: userAccounts.reduce((sum, a) => sum + toUsdMinor(a.balance.amount, a.balance.currency), 0),
    totalOutstandingUsd: userLoans.reduce((sum, l) => sum + l.outstanding.amount, 0),
    activeLoans: userLoans.filter((l) => l.status === 'disbursed').length,
    pendingApplications: userLoans.filter((l) => ['submitted', 'under_review', 'approved'].includes(l.status)).length,
    loanStatusBreakdown: [...breakdown].map(([status, count]) => ({ status, count })),
    cashflow: ({ months = 6 }) => {
      const buckets = new Map<string, CashflowPoint>()
      for (let i = months - 1; i >= 0; i--) {
        const key = monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)))
        buckets.set(key, { month: key, inflow: 0, outflow: 0 })
      }
      for (const t of transactions) {
        if (t.userId !== userId) continue
        const bucket = buckets.get(t.bookedAt.slice(0, 7))
        if (!bucket) continue
        const usd = toUsdMinor(t.amount.amount, t.amount.currency)
        if (t.type === 'credit') bucket.inflow += usd
        else bucket.outflow += usd
      }
      return [...buckets.values()]
    },
  }
}

/** Keeps the demo alive: when every loan is settled, a new application arrives. */
export function seedIncomingApplication(): { userId: string; loan: Loan } {
  const products = ['personal', 'auto', 'business'] as const
  const record = buildLoan('usr_1', {
    product: products[Math.floor(Math.random() * products.length)]!,
    amount: (20 + Math.floor(Math.random() * 100)) * 100,
    termMonths: 24,
    purpose: 'Auto-generated demo application',
  })
  loans.push(record)
  return { userId: record.userId, loan: toLoan(record) }
}
