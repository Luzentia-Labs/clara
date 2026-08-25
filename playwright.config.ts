import { defineConfig, devices } from '@playwright/test'

/**
 * Keyboard, focus-identity and computed-geometry suites run here (TSD): jsdom cannot compute
 * layout, so anything about real geometry or real focus order belongs in a browser.
 *
 * Chromium only for now. The TSD puts this suite on the CI-only side of the time budget, and
 * browser provisioning on a clean CI machine is US-01M0GMKD's problem, flagged there rather than
 * silently assumed here.
 */
export default defineConfig({
  // TSD:419 mandates `<Name>.keyboard.spec.ts` NEXT TO the component. `testDir: './e2e'` could not
  // see those files, so a co-located keyboard spec was silently skipped - an author would write a
  // focus-identity assertion, see green, and it never ran (review H3). US-01M0GM69 (Button) is the
  // first story with a keyboard interaction table, so this fired on day one.
  testDir: '.',
  testMatch: ['e2e/**/*.spec.ts', 'packages/*/src/**/*.spec.ts'],
  // A worktree and a Stryker sandbox are full copies of this repo, each with its own
  // `node_modules`. Left unignored, the suite loads a SECOND @playwright/test from the copy
  // and dies with "Requiring @playwright/test second time" - a failure with nothing to do
  // with the tests. CI never sees it (no worktrees there), so it only ever breaks locally,
  // while review agents are running, which is the worst time to be reading a confusing error.
  testIgnore: ['**/node_modules/**', '**/dist/**', '**/.claude/**', '**/.stryker-tmp/**'],
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `file://${process.cwd()}/e2e/fixtures/` },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
