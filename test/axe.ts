/**
 * An axe assertion built directly on `axe-core`.
 *
 * The TSD names `vitest-axe`. That package has been at 0.1.0 since 2025-01-22 (~19 months),
 * declares `peerDependencies: { vitest: ">=0.16.0" }` with no upper bound so it "supports" Vitest 4
 * only by omission, and pulls in six transitive dependencies - chalk, redent, lodash-es,
 * aria-query, dom-accessibility-api - to wrap a library Clara needs anyway. See D0032.
 *
 * The accessibility path is deliberately split across two seats (Idris decides inclusive design,
 * Mira proves it) precisely because a11y coverage is easy to fake. An unmaintained assertion layer
 * there is the wrong place to save ten lines.
 */
import axe from 'axe-core'
import { expect } from 'vitest'

/**
 * Serious and critical are the blocking severities per TSD gate 5 (TSD:102, TSD:334).
 *
 * **This is a real coverage cut, not a formality.** A review censused axe-core 4.13.0 and found 29
 * of 105 rules can never fail this matcher, 8 of them WCAG-conformance-tagged. Two are directly
 * reachable from Clara's surface: `form-field-multiple-labels` (moderate, WCAG 2.0 A, SC 3.3.2) and
 * `aria-deprecated-role` (minor, SC 4.1.2). `heading-order` at moderate was confirmed passing.
 * `incomplete` results are not surfaced either.
 *
 * The threshold matches the TSD, so this is a spec-level gap rather than a deviation - but the PRD
 * claims WCAG 2.2 AA, and a gate that cannot fail on a Level A criterion does not deliver that.
 * Recorded in `sdlc-studio/reviews/a11y-gap-register.md` rather than left implicit.
 */
const BLOCKING: ReadonlySet<string> = new Set(['serious', 'critical'])

export interface AxeResult {
  readonly violations: readonly axe.Result[]
}

export async function runAxe(container: Element): Promise<AxeResult> {
  const results = await axe.run(container, {
    // jsdom cannot compute layout, so colour-contrast is measured by the token contrast gate
    // (US-01M0GM66) against real values instead of being silently reported as "incomplete" here.
    rules: { 'color-contrast': { enabled: false } },
  })
  return { violations: results.violations }
}

expect.extend({
  toHaveNoBlockingViolations(received: AxeResult) {
    const blocking = received.violations.filter((v) => BLOCKING.has(v.impact ?? ''))
    if (blocking.length === 0) {
      return { pass: true, message: () => 'expected blocking accessibility violations, found none' }
    }
    const detail = blocking
      .map((v) => `  [${v.impact}] ${v.id}: ${v.help}\n    ${v.nodes.map((n) => n.html).join('\n    ')}`)
      .join('\n')
    return {
      pass: false,
      message: () => `${blocking.length} blocking accessibility violation(s):\n${detail}`,
    }
  },
})

// The type parameter must match `@vitest/expect`'s own `Matchers<T = any>` exactly, or TypeScript
// raises TS2428 "All declarations of 'Matchers' must have identical type parameters". That error
// was live in this file and nothing typechecked it - `pnpm typecheck` ran three per-package
// projects covering only `src` and `vite.config.ts`, so the whole harness was unchecked (B6).
declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- must mirror @vitest/expect
  interface Matchers<T = any> {
    toHaveNoBlockingViolations: () => T
  }
}
