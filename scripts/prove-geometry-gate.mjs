/**
 * Prove the geometry gate fails loudly on a missing build (BG-01M0WQ0X AC4).
 *
 * The gate measures `packages/react/dist`. If that is absent or stale, the honest outcome is a
 * hard error naming the missing files - not an empty page whose every assertion passes over
 * nothing. A gate that reports success because it measured no elements is worse than no gate,
 * and it is the specific failure this whole bug is about: a check that looks green while
 * checking the wrong thing, or nothing at all.
 *
 * THIS SCRIPT NEVER WRITES TO THE WORKING TREE. It points the builder at an empty temp root and
 * only ever reads the real one.
 */
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fail, pass } from './lib/workspace.mjs'
import { buildGeometryFixture, FixtureBuildError } from './build-geometry-fixture.mjs'

const RULE = 'prove-geometry-gate'
const problems = []

const stage = mkdtempSync(join(tmpdir(), 'clara-geometry-probe-'))
try {
  // A root that looks like a workspace but has never been built.
  writeFileSync(join(stage, 'package.json'), '{"name":"probe","private":true}')
  mkdirSync(join(stage, 'packages'), { recursive: true })

  let threw = null
  try {
    buildGeometryFixture({ root: stage })
  } catch (error) {
    threw = error
  }

  if (!threw) {
    problems.push('buildGeometryFixture returned a fixture from a root with no build - ' +
      'the gate would measure an empty page and report every assertion as passing')
  } else if (!(threw instanceof FixtureBuildError)) {
    problems.push(`the failure was ${threw.constructor.name}, not FixtureBuildError - a crash is ` +
      'not the same as a diagnosis, and the author cannot tell "run pnpm build" from a real defect')
  } else {
    // The message has to name what to do. "Cannot find module" would be technically a failure and
    // practically a dead end.
    for (const expected of ['pnpm build', 'packages/react/dist/index.cjs']) {
      if (!threw.message.includes(expected)) {
        problems.push(`the error message does not mention ${expected}: ${threw.message}`)
      }
    }
  }

  // And the counter-case: the real root DOES build a fixture, so the check above is discriminating
  // rather than a script that reports success whenever anything throws.
  try {
    const html = buildGeometryFixture({})
    if (!html.includes('data-case=')) {
      problems.push('the real root produced a fixture with no measurable case in it')
    }
  } catch (error) {
    problems.push(`the real root failed to build a fixture (run \`pnpm build\`): ${error.message}`)
  }
} finally {
  rmSync(stage, { recursive: true, force: true })
}

if (problems.length) fail(RULE, problems)
pass(RULE, 'a missing build fails the geometry fixture loudly, and a real build produces cases')
