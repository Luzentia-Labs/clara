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
import { join, dirname, resolve as resolvePath, relative } from 'node:path'
import { fail, pass } from './lib/workspace.mjs'

const RULE = 'story-verifiers'
const root = process.cwd()
const storiesDir = join(root, 'sdlc-studio/stories')
if (!existsSync(storiesDir)) fail(RULE, ['sdlc-studio/stories is missing'])

/** Every declared block name in the suite, from source - no runner needed. Kept PER FILE, because
 * "which tests does this selector reach" is the question the reachability rule below asks. */
const names = []
const testFiles = []
const collect = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === 'dist') continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { collect(full); continue }
    if (!/\.test\.tsx?$/.test(entry.name)) continue
    const source = readFileSync(full, 'utf8')
    const own = []
    for (const m of source.matchAll(/^\s*(?:describe|it|test)(?:\.\w+)?(?:\([^)]*\))?\(\s*[`'"]([^`'"]+)/gm)) {
      names.push(m[1])
      own.push(m[1])
    }
    testFiles.push({ file: full, names: own })
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

/**
 * A story with a Test Plan must have one row per criterion, aligned by number and title.
 *
 * Two criteria were added in the commit that introduced them and their rows were not, so the last
 * row carried the NEXT criterion's mutant and the table was misnumbered from there - a Test Plan
 * that names the wrong mutant for every row after the gap. `check:story-verifiers` passed and could
 * not see it, which is this project's recurring shape: a guard shipped without being subject to the
 * rule it enforces.
 */
for (const file of readdirSync(storiesDir).filter((f) => f.startsWith('US') && f.endsWith('.md'))) {
  const text = readFileSync(join(storiesDir, file), 'utf8')
  if (!text.includes('## Test Plan')) continue
  const criteria = [...text.matchAll(/^### AC(\d+): (.+)$/gm)].map((m) => [Number(m[1]), m[2].trim()])
  // Four columns since the `Touches` column landed: AC | Touches | Mutant | Title. Read the LAST
  // cell as the title rather than a fixed group index, so adding a column cannot silently make the
  // alignment check compare a title against a mutant.
  const rows = [...text.matchAll(/^\| (AC\d+) \|(.*)\|\s*$/gm)].map((m) => {
    const cells = m[2].split('|').map((c) => c.trim())
    return [Number(m[1].slice(2)), cells[cells.length - 1]]
  })
  if (rows.length !== criteria.length) {
    problems.push(`${file}: ${criteria.length} criteria but ${rows.length} Test Plan row(s) - a criterion with no row names no mutant, and the rows after the gap describe the wrong ones`)
    continue
  }
  for (const [i, [n, title]] of criteria.entries()) {
    const [rowN, rowTitle] = rows[i]
    if (rowN !== n || rowTitle !== title) {
      problems.push(`${file}: Test Plan row ${i + 1} is "AC${rowN}: ${rowTitle}" but criterion ${i + 1} is "AC${n}: ${title}" - the table is misaligned, so rows name other criteria's mutants`)
    }
  }
}

/**
 * A verifier must reach what its own mutant changes.
 *
 * `vitest -t` selects tests by NAME across the whole workspace, so a criterion can be stamped
 * `Verified: yes` by a green run of tests that cannot see the code its Test Plan says the test
 * "must fail on". Three times: US-01M0GMF3 AC3, and US-01M0GM61 AC3 and AC4. Each was found by a
 * review seat probing by hand, never by a gate (CR-01M0SKZ6).
 *
 * The first design tried to INFER the touched file from the mutant prose. That does not work and
 * the measurement is worth keeping: of 56 verified criteria, 55 rows named no file at all, and
 * mining identifiers instead was wrong in both directions - `setTimeout` in "wrap `onChange` in a
 * `setTimeout`" names the mutation to ADD; `aria-checked="mixed"` is written
 * `aria-checked={indeterminate ? 'mixed' : undefined}`; and common words like `open` matched every
 * file, so the rule passed vacuously on exactly the criterion it was built to catch.
 *
 * So the row says it instead, in a `Touches` column. Exact, no heuristic, and it forces the author
 * to state what they are mutating - which is the discipline, not a side effect of it.
 *
 * WHAT THIS DOES NOT CATCH: a verifier that selects the right FILE but the wrong tests inside it.
 * US-01M0GMF3 AC3 was exactly that - three stepping tests selected, none of them the one the
 * criterion had been rewritten for. That needs per-test analysis and is out of scope; it is stated
 * here so this guard is not read as proving more than it does.
 */
const SOURCE_EXT = /\.(tsx?|mjs|js)$/
const resolveModule = (p) => {
  for (const c of [p, `${p}.ts`, `${p}.tsx`, `${p}.mjs`, join(p, 'index.ts'), join(p, 'index.tsx')]) {
    if (existsSync(c) && statSync(c).isFile()) return c
  }
  return null
}
/** Every source file a test file transitively imports. */
const reachCache = new Map()
const reachedBy = (file, seen = new Set()) => {
  if (seen.has(file)) return seen
  seen.add(file)
  let src
  try { src = readFileSync(file, 'utf8') } catch { return seen }
  for (const m of src.matchAll(/from\s+['"](\.[^'"]*)['"]/g)) {
    const target = resolveModule(resolvePath(dirname(file), m[1]))
    if (target) reachedBy(target, seen)
  }
  return seen
}
const reachOf = (file) => {
  if (!reachCache.has(file)) reachCache.set(file, [...reachedBy(file)].map((f) => relative(root, f)))
  return reachCache.get(file)
}

let touchesChecked = 0
for (const file of readdirSync(storiesDir).filter((f) => f.startsWith('US') && f.endsWith('.md'))) {
  const text = readFileSync(join(storiesDir, file), 'utf8')
  if (!text.includes('## Test Plan')) continue
  const hasTouches = /^\| Criterion \| Touches \|/m.test(text)
  const rows = new Map()
  for (const m of text.matchAll(/^\| (AC\d+) \|(.*)\|\s*$/gm)) {
    const cells = m[2].split('|').map((c) => c.trim())
    rows.set(m[1], hasTouches ? cells[0] : '')
  }

  for (const block of text.split(/^### /m).slice(1)) {
    const ac = /^(AC\d+):/.exec(block)?.[1]
    if (!ac || !/\*\*Verified:\*\* yes/.test(block)) continue
    const verify = /\*\*Verify:\*\* (.+)/.exec(block)?.[1] ?? ''
    const touches = rows.get(ac)

    if (!hasTouches || !touches) {
      problems.push(`${file} ${ac}: its Test Plan row names no \`Touches\` file, so nothing can check that its verifier reaches what the mutant changes`)
      continue
    }
    const paths = touches.split(',').map((t) => t.trim()).filter(Boolean)
    const missing = paths.filter((t) => !existsSync(join(root, t)))
    if (missing.length) {
      problems.push(`${file} ${ac}: \`Touches\` names ${missing.join(', ')}, which does not exist`)
      continue
    }
    /*
     * A SHELL verifier's `Touches` is checked for EXISTENCE only, and that is a stated limit rather
     * than an oversight.
     *
     * A review found the consequence: setting a shell criterion's `Touches` to `package.json` leaves
     * this guard PASS at the identical "N reach the file" count, so a repair that repointed such a
     * cell was unobserved.
     *
     * An attempt to close it - requiring the command to name the file or a directory containing it -
     * was written, measured, and REVERTED: it flagged five correct criteria across two stories,
     * because a guard script reaches files it never names on its command line
     * (`check-component-css.mjs` reads `styles.css`; `check-verification.mjs --component Popover`
     * reads that component's record). A rule that fails correct work is worse than no rule.
     *
     * The honest form of this check is to mutate the named file and run the verifier - which is
     * precisely what `prove-guards-fail.mjs` does, one criterion at a time, at ~1s each. Doing it
     * for every shell criterion belongs in that prover rather than here.
     *
     * So: `touchesChecked` counts only criteria whose alignment was actually checked, and the
     * reported number therefore means what it says.
     */
    const pattern = /vitest "([^"]+)"/.exec(verify)?.[1]
    if (!pattern) continue
    touchesChecked++
    if (pattern.includes('%s')) continue
    let re
    try { re = new RegExp(pattern) } catch { continue }
    const selected = testFiles.filter((t) => t.names.some((n) => re.test(n)))
    if (!selected.length) continue // already reported by the rule above

    // A test can also READ an asset rather than import it - `layers.test.ts` reads the token JSON
    // with readFileSync, which is the right way to assert a token source and is invisible to an
    // import graph. Reading the file counts as reaching it.
    const readsAsset = (t) => {
      const base = t.split('/').pop()
      return selected.some((sel) => {
        const src = readFileSync(sel.file, 'utf8')
        return src.includes(t) || src.includes(base)
      })
    }
    const sourceTargets = paths.filter((t) => SOURCE_EXT.test(t))
    // Assets are checked whether or not the row ALSO names a source file. Gating this on
    // "the row names no source file" let a mixed `Touches` skip it entirely: AC9 names both
    // `Modal.tsx` and `styles.css`, the .tsx satisfied the import rule, and the stylesheet half -
    // the half jsdom cannot see - went unchecked.
    const assetTargets = paths.filter((t) => !SOURCE_EXT.test(t))
    const unreadable = assetTargets.filter((t) => !readsAsset(t))
    if (unreadable.length && !/\bshell\b/.test(verify)) {
      // An asset no test can import - a stylesheet, a token source, a docs page. A vitest-only
      // verifier over one of those is green by construction: jsdom computes no layout and reads no
      // markdown. The verifier has to run something that actually reads the file.
      problems.push(
        `${file} ${ac}: \`Touches\` names ${unreadable.join(', ')}, which no test imports or reads, but the verifier is vitest only - ` +
        'a test cannot see a change to an asset it does not load, so this criterion needs a guard in its verifier too',
      )
      continue
    }
    if (!sourceTargets.length) continue // an asset the selected tests read directly
    const reached = sourceTargets.some((t) => selected.some((s) => reachOf(s.file).includes(t)))
    if (!reached) {
      problems.push(
        `${file} ${ac}: verifier vitest "${pattern}" selects tests in ` +
        `${selected.map((s) => relative(root, s.file)).join(', ')}, none of which import ${sourceTargets.join(' or ')} - ` +
        'the criterion is stamped verified by tests that cannot see the code its own mutant changes',
      )
    }
  }
}

if (problems.length) fail(RULE, problems)
pass(RULE, `${checked} story verifier(s) across ${names.length} declared test name(s); every one selects a real test, and ${touchesChecked} reach the file its own mutant changes`)
