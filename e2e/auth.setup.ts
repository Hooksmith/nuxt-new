import { expect, gotoHydrated, test as setup } from './fixtures'

const authFile = 'e2e/.auth/user.json'

/** Signs in once and shares the session with every test (keeps us under the login rate limit). */
setup('sign in', async ({ page }) => {
  await gotoHydrated(page, '/login')
  await page.getByLabel('Email address').fill('demo@bank.test')
  await page.getByLabel('Password').fill('Password123!')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Welcome back/ })).toBeVisible()
  await page.context().storageState({ path: authFile })
})
