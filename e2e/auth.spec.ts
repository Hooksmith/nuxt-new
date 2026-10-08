import { expect, gotoHydrated, test } from './fixtures'

test.describe('authentication', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('redirects anonymous users to login and back after signing in', async ({ page }) => {
    await gotoHydrated(page, '/accounts')
    await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)accounts$/)

    await page.getByLabel('Email address').fill('demo@bank.test')
    await page.getByLabel('Password').fill('Password123!')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL('/accounts')
    await expect(page.getByRole('heading', { level: 1, name: 'Accounts' })).toBeVisible()
  })

  test('shows an accessible error summary for invalid input', async ({ page, expectAccessible }) => {
    await gotoHydrated(page, '/login')
    await page.getByRole('button', { name: 'Sign in' }).click()

    const summary = page.getByRole('alert').filter({ hasText: 'There is a problem' })
    await expect(summary).toBeFocused()
    await expect(summary.getByRole('link', { name: 'Enter your email address' })).toBeVisible()
    await expect(page.getByLabel('Email address')).toHaveAttribute('aria-invalid', 'true')
    await expectAccessible()
  })

  test('rejects wrong credentials without revealing which part was wrong', async ({ page }) => {
    await gotoHydrated(page, '/login')
    await page.getByLabel('Email address').fill('demo@bank.test')
    await page.getByLabel('Password').fill('WrongPassword1')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('alert')).toContainText('The email or password you entered is incorrect.')
  })

  test('ignores open-redirect attempts', async ({ page }) => {
    await gotoHydrated(page, '/login?redirect=//evil.example')
    await page.getByLabel('Email address').fill('demo@bank.test')
    await page.getByLabel('Password').fill('Password123!')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/')
  })
})
