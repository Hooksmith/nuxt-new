import AxeBuilder from '@axe-core/playwright'
import { test as base, expect, type Page } from '@playwright/test'

/** Navigates and waits until Vue has hydrated, so form interactions aren't lost on slow runners. */
export async function gotoHydrated(page: Page, url: string) {
  const response = await page.goto(url)
  await page.locator('html[data-hydrated="true"]').waitFor({ state: 'attached' })
  return response
}

/** Adds an `expectAccessible()` helper that fails on any WCAG 2.2 A/AA violation. */
export const test = base.extend<{ expectAccessible: () => Promise<void> }>({
  expectAccessible: async ({ page }, use) => {
    await use(async () => {
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([])
    })
  },
})

export { expect, type Page }
