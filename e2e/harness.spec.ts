import { expect, test } from '@playwright/test'

/**
 * Proves the browser suite runs end to end: a real browser launches, loads a page, and the
 * reporter reports. Replaced by real keyboard and geometry suites once components exist.
 */
test('a real browser loads the fixture and finds its controls', async ({ page }) => {
  await page.goto('harness.html')
  await expect(page.getByRole('heading', { name: 'Clara harness' })).toBeVisible()
  const probe = page.getByRole('button', { name: 'Probe' })
  await probe.focus()
  // Focus identity is a real assertion, not a smoke check - the TSD makes it a per-overlay gate.
  await expect(probe).toBeFocused()
})
