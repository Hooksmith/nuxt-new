import { randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import {
  KHR_PER_USD,
  LOAN_PRODUCTS,
  canTransition,
  creditBand,
  maskAccountNumber,
  monthlyPayment,
  type Account,
  type AccountType,
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

// Deterministic PRNG so every replica / restart produces the same demo data.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const random = mulberry32(20261008)
const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)]!
const between = (min: number, max: number) => Math.round(min + random() * (max - min))

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 32).toString('hex')
}

const now = new Date()
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString()
const monthKey = (date: Date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

export const DEMO_CREDENTIALS = { email: 'demo@bank.test', password: 'Password123!' } as const

const demoSalt = 'demo-salt-not-for-production'
const users: UserRecord[] = [
  {
    id: 'usr_1',
    name: 'Dara Sok',
    email: DEMO_CREDENTIALS.email,
    segment: 'premier',
    customerSince: '2019-04-12',
    passwordSalt: demoSalt,
    passwordHash: hashPassword(DEMO_CREDENTIALS.password, demoSalt),
  },
]

const accounts: AccountRecord[] = [
  account('acc_1', 'Everyday Checking', 'checking', '0012 3456 7890', 'USD', 1_284_550),
  account('acc_2', 'Goal Saver', 'savings', '0012 3456 4821', 'USD', 4_520_000),
  account('acc_3', 'Riel Savings', 'savings', '0045 1188 2093', 'KHR', 1_850_000_000),
  account('acc_4', '12-Month Term Deposit', 'term_deposit', '0090 7731 5566', 'USD', 10_000_000),
]

function account(
  id: string,
  name: string,
  type: AccountType,
  number: string,
  currency: Currency,
  balance: number,
): AccountRecord {
  const held = type === 'checking' ? 12_500 : 0
  return {
    id,
    userId: 'usr_1',
    name,
    type,
    number,
    balance: { amount: balance, currency },
    availableBalance: { amount: balance - held, currency },
    status: 'active',
    openedAt: '2019-04-12T00:00:00.000Z',
  }
}

const merchants: Record<'debit' | 'credit', readonly (readonly [string, string])[]> = {
  debit: [
    ['Lucky Supermarket', 'Groceries'],
    ['Brown Coffee', 'Dining'],
    ['EDC Electricity', 'Utilities'],
    ['Smart Axiata', 'Telecom'],
    ['Grab', 'Transport'],
    ['Aeon Mall', 'Shopping'],
    ['Tela Fuel', 'Transport'],
    ['Royal Phnom Penh Hospital', 'Health'],
  ],
  credit: [
    ['Acme Co. Payroll', 'Salary'],
    ['Transfer from Goal Saver', 'Transfer'],
    ['Interest', 'Interest'],
    ['Refund', 'Refund'],
  ],
}

const transactions: (Transaction & { userId: string })[] = []
for (const acc of accounts) {
  const perMonth = acc.type === 'checking' ? 24 : acc.type === 'savings' ? 4 : 1
  const scale = acc.balance.currency === 'KHR' ? KHR_PER_USD : 1
  for (let day = 0; day < 180; day += Math.max(1, Math.round(30 / perMonth))) {
    const isSalary = acc.type === 'checking' && day % 30 === 0
    const type = isSalary || random() < (acc.type === 'checking' ? 0.15 : 0.6) ? 'credit' : 'debit'
    const [counterparty, category] = isSalary ? merchants.credit[0]! : pick(merchants[type])
    const amountUsd = isSalary ? 3_250_00 : type === 'credit' ? between(2_000, 60_000) : between(350, 18_000)
    transactions.push({
      id: `txn_${acc.id}_${day}`,
      userId: acc.userId,
      accountId: acc.id,
      type,
      amount: { amount: amountUsd * scale, currency: acc.balance.currency },
      description: type === 'credit' ? `${category} — ${counterparty}` : `Card payment — ${counterparty}`,
      category,
      counterparty,
      status: day < 2 && type === 'debit' ? 'pending' : 'posted',
      bookedAt: daysAgo(day + random()),
    })
  }
}
transactions.sort((a, b) => b.bookedAt.localeCompare(a.bookedAt))

let loanSequence = 0
const loans: LoanRecord[] = []

function nextReference() {
  loanSequence += 1
  return `LN-${now.getUTCFullYear()}-${String(loanSequence).padStart(4, '0')}`
}

function buildLoan(
  userId: string,
  input: { product: LoanProduct; amount: number; termMonths: number; purpose: string },
  path: LoanStatus[],
  ageDays: number,
): LoanRecord {
  const { annualRate } = LOAN_PRODUCTS[input.product]
  const principal = input.amount * 100
  const history = path.map((status, index) => ({
    status,
    at: daysAgo(ageDays - index * Math.max(1, Math.floor(ageDays / path.length))),
  }))
  const status = path.at(-1)!
  return {
    id: `loan_${randomUUID().slice(0, 8)}`,
    userId,
    reference: nextReference(),
    product: input.product,
    principal: { amount: principal, currency: 'USD' },
    annualRate,
    termMonths: input.termMonths,
    monthlyPayment: { amount: monthlyPayment(principal, annualRate, input.termMonths), currency: 'USD' },
    outstanding: { amount: status === 'disbursed' ? Math.round(principal * 0.82) : 0, currency: 'USD' },
    purpose: input.purpose,
    status,
    createdAt: history[0]!.at,
    updatedAt: history.at(-1)!.at,
    history,
  }
}

loans.push(
  buildLoan(
    'usr_1',
    { product: 'home', amount: 85_000, termMonths: 240, purpose: 'Purchase of a townhouse in Sen Sok' },
    ['submitted', 'under_review', 'approved', 'disbursed'],
    420,
  ),
  buildLoan(
    'usr_1',
    { product: 'auto', amount: 18_500, termMonths: 60, purpose: 'Hybrid vehicle for family use' },
    ['submitted', 'under_review', 'approved'],
    12,
  ),
  buildLoan(
    'usr_1',
    { product: 'personal', amount: 4_000, termMonths: 24, purpose: 'Home renovation and new furniture' },
    ['submitted', 'under_review'],
    4,
  ),
  buildLoan(
    'usr_1',
    { product: 'business', amount: 30_000, termMonths: 36, purpose: 'Working capital for a coffee shop' },
    ['submitted'],
    1,
  ),
  buildLoan(
    'usr_1',
    { product: 'personal', amount: 15_000, termMonths: 12, purpose: 'Debt consolidation of credit cards' },
    ['submitted', 'under_review', 'rejected'],
    90,
  ),
)

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
  const record = buildLoan(userId, application, ['submitted'], 0)
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

export function getCreditScore(_userId: string): CreditScore {
  const history = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (11 - i), 1))
    return { month: monthKey(date), score: 688 + Math.round(i * 4.6 + Math.sin(i) * 6) }
  })
  const current = history.at(-1)!.score
  return {
    current,
    band: creditBand(current),
    updatedAt: daysAgo(3),
    history,
    factors: [
      { label: 'Payment history', impact: 'positive', detail: '100% of repayments on time in the last 24 months.' },
      {
        label: 'Credit utilisation',
        impact: 'neutral',
        detail: 'You are using 34% of available credit. Below 30% is ideal.',
      },
      { label: 'Length of credit history', impact: 'positive', detail: 'Your oldest account is 7 years old.' },
      { label: 'Recent applications', impact: 'negative', detail: '2 loan applications in the last 30 days.' },
    ],
  }
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
  const product = pick(['personal', 'auto', 'business'] as const)
  const record = buildLoan(
    'usr_1',
    { product, amount: between(20, 120) * 100, termMonths: 24, purpose: 'Auto-generated demo application' },
    ['submitted'],
    0,
  )
  loans.push(record)
  return { userId: record.userId, loan: toLoan(record) }
}
