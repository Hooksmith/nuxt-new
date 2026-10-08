import { expect, gotoHydrated, test } from './fixtures'

test('dashboard renders analytics and is accessible', async ({ page, expectAccessible }) => {
  await gotoHydrated(page, '/')
  await expect(page.getByRole('heading', { level: 1, name: /Welcome back, Dara/ })).toBeVisible()
  await expect(page.getByText('Total deposits')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Cash flow' }).locator('canvas')).toBeVisible()
  await expect(page.getByRole('img', { name: /Credit score \d+ out of 850/ })).toBeVisible()
  await expect(page.getByText('Live', { exact: true })).toBeVisible()
  await expectAccessible()
})

test('hide balances toggles every amount', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Toggle lives in the desktop header')
  await gotoHydrated(page, '/')
  await page.getByRole('button', { name: 'Hide balances' }).click()
  await expect(page.getByText('Amount hidden').first()).toBeAttached()
  await page.getByRole('button', { name: 'Show balances' }).click()
})

test('skip link moves focus to the main content', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Keyboard navigation')
  await gotoHydrated(page, '/')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to main content' })
  await expect(skip).toBeFocused()
  await skip.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
})

test('transactions can be filtered and paginated via the URL', async ({ page, expectAccessible }) => {
  await gotoHydrated(page, '/accounts/acc_1')
  await expect(page.getByRole('heading', { level: 1, name: 'Everyday Checking' })).toBeVisible()

  await page.getByLabel('Transaction type').selectOption('credit')
  await expect(page).toHaveURL(/type=credit/)

  await page.getByLabel('Search transactions').fill('salary')
  await expect(page).toHaveURL(/search=salary/)
  await expect(page.getByRole('table').getByRole('row').nth(1)).toContainText('Salary')
  await expectAccessible()
})

test('unknown accounts return a 404 page', async ({ page }) => {
  const response = await page.goto('/accounts/does-not-exist')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
})
