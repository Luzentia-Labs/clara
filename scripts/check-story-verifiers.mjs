#!/usr/bin/env node
/**
 * Every story's `vitest "<pattern>"` verifier must select at least one test that exists.
 *
 * `vitest run -t` exits 0 when its pattern matches nothing - it reports the tests as skipped and
 * succeeds - so a renamed or deleted `describe` turns an acceptance criterion into a green check
 * that ran nothing. `verify_ac.py` catches it at run time (it treats an all-skipped run as a
 * failure, and did catch one here), but only for the criteria someone re-verifies. This catches it
 * for ALL of them, at the same moment as every other guard, without running the suite.
 *
 * It is the same rule `check-verification.mjs` applies to a cited gate's selector, applied to the
 * place the selectors mostly live. Raised by a review seat after it proved the vacuity by hand.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fail, pass } from './lib/workspace.mjs'

const RULE = 'story-verifiers'
const root = process.cwd()
const storiesDir = join(root, 'sdlc-studio/stories')
if (!existsSync(storiesDir)) fail(RULE, ['sdlc-studio/stories is missing'])

/** Every declared block name in the suite, from source - no runner needed. */
const names = []
const collect = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { collect(full); continue }
    if (!/\.test\.tsx?$/.test(entry.name)) continue
    const source = readFileSync(full, 'utf8')
    for (const m of source.matchAll(/^\s*(?:describe|it|test)(?:\.\w+)?(?:\([^)]*\))?\(\s*[`'"]([^`'"]+)/gm)) {
      names.push(m[1])
    }
  }
}
for (const dir of ['packages', 'scripts', 'test']) {
  const full = join(root, dir)
  if (existsSync(full) && statSync(full).isDirectory()) collect(full)
}
if (!names.length) fail(RULE, ['no test names found at all - this guard would pass vacuously'])

const problems = []
let checked = 0
for (const file of readdirSync(storiesDir).filter((f) => f.startsWith('US') && f.endsWith('.md'))) {
  const text = readFileSync(join(storiesDir, file), 'utf8')
  /**
   * Only criteria that CLAIM to be verified.
   *
   * A Draft story for an unbuilt component naming the test it will need is correct planning, not a
   * defect - and failing it would punish writing the criterion before the code, which is the order
   * this project asks for. The defect is a `Verified: yes` stamp sitting on a selector that matches
   * nothing, because that is a green check that ran no test.
   */
  for (const m of text.matchAll(/\*\*Verify:\*\* vitest "([^"]+)"\n- \*\*Verified:\*\* yes/g)) {
    checked++
    const pattern = m[1]
    let re
    try { re = new RegExp(pattern) } catch { problems.push(`${file}: verifier /${pattern}/ is not a valid regex`); continue }
    // A `%s` placeholder comes from describe.each and is expanded at run time.
    if (pattern.includes('%s')) continue
    if (!names.some((n) => re.test(n))) {
      problems.push(
        `${file}: verifier vitest "${pattern}" matches no test name in the suite - ` +
        '`vitest -t` exits 0 when it selects nothing, so this criterion passes having run nothing',
      )
    }
  }
}

if (problems.length) fail(RULE, problems)
pass(RULE, `${checked} story verifier(s) across ${names.length} declared test name(s); every one selects a real test`)
