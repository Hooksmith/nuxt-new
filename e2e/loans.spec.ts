import { expect, gotoHydrated, test, type Page } from './fixtures'

async function fillPersonal(page: Page) {
  await page.getByLabel('Mobile number').fill('012 345 678')
  await page.getByLabel('National ID number').fill('123456789')
  await page.getByLabel('Date of birth').fill('1990-05-01')
  await page.getByRole('button', { name: 'Continue' }).click()
}

async function fillEmployment(page: Page, income: string) {
  await page.getByLabel('Employed', { exact: true }).check()
  await page.getByLabel('Employer or business name').fill('Acme Co.')
  await page.getByLabel('Net monthly income (USD)').fill(income)
  await page.getByRole('button', { name: 'Continue' }).click()
}

test('navigates from the shell into the loans zone', async ({ page, isMobile }) => {
  await gotoHydrated(page, '/')
  if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Loans', exact: true }).click()
  await expect(page).toHaveURL(/\/loans\/?$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Your loans' })).toBeVisible()
})

test('loan application wizard validates each step and submits', async ({ page, expectAccessible }) => {
  await gotoHydrated(page, '/loans/apply')
  await expect(page.getByRole('heading', { level: 1, name: 'Apply for a loan' })).toBeVisible()

  // Step 1 — validation errors are summarised and focusable.
  await page.getByLabel('Mobile number').fill('123')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'There is a problem' })).toBeFocused()
  await expectAccessible()
  await fillPersonal(page)

  // Step 2
  await expect(page.getByRole('heading', { level: 2, name: /Income/ })).toBeFocused()
  await fillEmployment(page, '500')

  // Step 3 — affordability rule rejects a loan that's too large for the income.
  await page.getByLabel('Personal loan').check()
  await page.getByLabel('Loan amount (USD)').fill('20000')
  await page.getByLabel('Repayment term').selectOption('12')
  await page.getByLabel('What will you use the loan for?').fill('Kitchen renovation and appliances')
  await expect(page.getByRole('complementary', { name: 'Repayment estimate' })).toContainText('$1,772.30')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText(/more than 50% of your income/).first()).toBeVisible()

  await page.getByLabel('Loan amount (USD)').fill('3000')
  await page.getByLabel('Repayment term').selectOption('24')
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step 4 — review + consents.
  await expect(page.getByRole('heading', { level: 3, name: 'Loan' })).toBeVisible()
  await expect(page.getByText('•••••6789')).toBeVisible()
  await page.getByLabel(/accept the loan terms/).check()
  await page.getByLabel(/consent to the bank checking/).check()
  await expectAccessible()
  await page.getByRole('button', { name: 'Submit application' }).click()

  await expect(page.getByRole('status').filter({ hasText: 'Application submitted' })).toBeVisible()
  await expect(page.getByText('Submitted').first()).toBeVisible()
})

test('a submitted application can be withdrawn (optimistic update)', async ({ page, context }) => {
  // Arrange: create a fresh application through the API (same CSRF rules as the UI).
  await page.goto('/loans')
  const csrf = (await context.cookies()).find((c) => c.name === 'XSRF-TOKEN')!.value
  const response = await page.request.post('/api/loans', {
    headers: { 'x-csrf-token': csrf },
    data: {
      fullName: 'Dara Sok',
      email: 'demo@bank.test',
      phone: '012345678',
      nationalId: '123456789',
      dateOfBirth: '1990-01-01',
      employmentStatus: 'employed',
      employerName: 'Acme',
      monthlyIncome: 3000,
      product: 'personal',
      amount: 2000,
      termMonths: 12,
      purpose: 'E2E withdrawal scenario',
      agreeTerms: true,
      consentCreditCheck: true,
    },
  })
  expect(response.status()).toBe(201)
  const loan = await response.json()

  await gotoHydrated(page, `/loans/${loan.id}`)
  const withdraw = page.getByRole('button', { name: 'Withdraw application' })
  test.skip(!(await withdraw.isVisible()), 'The simulator already moved this loan past the withdrawable stage')
  await withdraw.click()
  const dialog = page.getByRole('dialog', { name: 'Withdraw this application?' })
  await expect(dialog.getByRole('button', { name: 'Keep application' })).toBeFocused()
  await dialog.getByRole('button', { name: 'Withdraw', exact: true }).click()
  await expect(page.getByText('Withdrawn').first()).toBeVisible()
  await expect(withdraw).toBeHidden()
})
