import { defineConfig, devices } from '@playwright/test'
import { join } from 'node:path'

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
  // These two are full COPIES of this repo, each with its own `node_modules`. Left unignored, the
  // suite loads a second @playwright/test from the copy and dies with "Requiring @playwright/test
  // second time" - a failure with nothing to do with the tests.
  //
  // Anchored with an absolute path built from `cwd`, because neither glob form works in both
  // places. `**/.claude/**` matches the absolute path, so a checkout living UNDER
  // `.claude/worktrees/` ignored every one of its own specs and a review agent got "No tests
  // found" - and D0070 puts reviewers in worktrees, so that made these gates unrunnable by exactly
  // the seat that must run them. `./.claude/**` fixed the worktree and stopped matching from the
  // main checkout, putting the crash back. An absolute prefix from `cwd` is correct in both: from
  // the main repo it excludes the worktrees, and from inside one it excludes only that one's own
  // (non-existent) nested copies.
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    join(process.cwd(), '.claude/**'),
    join(process.cwd(), '.stryker-tmp/**'),
  ],
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `file://${process.cwd()}/e2e/fixtures/` },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
