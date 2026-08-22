/**
 * Prove the coverage gate in `vitest.config.ts` can FAIL.
 *
 * Coverage currently reports `100% (0/0)` - both packages export `export {}`, so the threshold
 * passes because there is nothing to measure. A number that cannot go down is not a gate.
 *
 * ## Two ways the first version of this script lied
 *
 *   1. It passed `--coverage.thresholds.statements=90` on the command line, so it never read the
 *      shipped config. Deleting `thresholds` from vitest.config.ts entirely - removing D0014's
 *      gate outright - still produced PASS (review B1).
 *   2. It asserted only a NON-ZERO EXIT. One unrelated failing test produced the same exit code
 *      and the script reported the coverage gate had fired (review B2). That is precisely the F2
 *      defect this epic has now corrected five times: asserting an outcome that many causes share.
 *
 * So: no threshold flags - the shipped config is the thing under test - and the assertion is on
 * vitest's own threshold DIAGNOSTIC, not on the exit code. The run must also report no failing
 * tests, so a broken suite cannot be mistaken for a firing gate.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import picomatch from 'picomatch'
import { fail, pass } from './lib/workspace.mjs'

const root = process.cwd()
// Namespaced per run: a fixed shared path gave a false FAIL under concurrency, and AGENTS.md
// forbids generically-named shared temp paths by name (review B3).
mkdirSync(join(root, '.coverage-fixture'), { recursive: true })
const dir = mkdtempSync(join(root, '.coverage-fixture', 'run-'))
const rel = dir.slice(root.length + 1)

const cleanup = () => rmSync(dir, { recursive: true, force: true })
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => { cleanup(); process.exit(130) })
process.on('exit', () => { cleanup(); rmSync(join(root, '.coverage-fixture'), { recursive: true, force: true }) })

// The fixture is deliberately LARGE, and that is not arbitrary.
//
// It used to be one four-branch function - about five statements. That trips a 90% threshold only
// while the codebase is small: the gate needs uncovered/(covered+uncovered) > 10%, so as real code
// accumulates a fixed-size fixture stops being able to move the ratio at all. This prover would
// then pass forever without proving anything, which is the exact failure it exists to detect, one
// level up. Caught when the first two components landed and the fixture could no longer breach
// the threshold.
//
// 400 functions is roughly 2000 uncovered statements, which breaches a 90% threshold while the
// covered set stays under about 18,000. That is a bound, not "any size" - the same fixed-size
// defect with a larger constant. It is acceptable only because this prover FAILS LOUDLY when it
// stops working (it asserts on the threshold diagnostic, not on a ratio it computed), so the cost
// of outgrowing it is a puzzling red gate rather than a silent green one. Deriving the size from
// the measured covered-statement count would remove the bound entirely.
const UNCOVERED_FUNCTIONS = 400
writeFileSync(
  join(dir, 'uncovered.ts'),
  Array.from({ length: UNCOVERED_FUNCTIONS }, (_, i) => `export function neverCalled${i} (n: number): string {
  if (n > 10) return 'big'
  if (n > 5) return 'medium'
  if (n > 0) return 'small'
  return 'none'
}`).join('\n') + '\n',
)

// The shipped `coverage.include` must ALSO be exercised, not overridden. Passing an include on the
// command line meant a shipped scope pointing at nothing still gave PASS here while the real gate
// went vacuous (review H1) - B1's own finding one level in.
//
// So: assert the shipped include resolves to real files FIRST, then add the fixture to that scope
// rather than replacing it.
const shipped = readFileSync(join(root, 'vitest.config.ts'), 'utf8')
// Must target coverage.include specifically. A bare /include:/ matched `test.include` first - the
// wrong key - so this check silently read a healthy value while the coverage scope was broken.
const coverageBlock = shipped.slice(shipped.indexOf('coverage:'))
const includeMatch = coverageBlock.match(/include:\s*\[([^\]]*)\]/)
const shippedIncludes = includeMatch ? [...includeMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : []
// `coverage.exclude` was never read, so a scope proven to RESOLVE could be silently emptied by the
// sibling key - widening exclude to `packages/*/src/**` left this prover passing while the real gate
// reported 0/0 and exited 0 (review Y7). H1's finding one field over.
const excludeMatch = coverageBlock.match(/exclude:\s*\[([\s\S]*?)\]/)
const shippedExcludes = excludeMatch ? [...excludeMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : []
// Two distinct conditions, previously conflated - and conflating them is why two earlier attempts
// at this check were wrong (review X7):
//
//   scope matches ZERO FILES        -> the config is broken. Fail.
//   scope matches files with ZERO
//   executable statements           -> vacuous but correct. Both packages export `export {}` today.
//                                      Reported in the banner, not failed - a permanently red gate
//                                      is a permanently ignored one (D0030's own reasoning).
//
// File counting expands the glob's own extension list rather than assuming `.ts`.
// Glob matching is done by picomatch - the same matcher vite/vitest use - not by hand. Three
// previous attempts at this check re-implemented glob semantics and each got them subtly wrong in a
// different way: `existsSync('packages')`, an ignored extension, and then a pattern with no
// extension matching everything. The reviewer's note was the same each time; this is the fix that
// stops repeating it.
const allFiles = (dir) => {
  if (!existsSync(dir)) return []
  if (!statSync(dir).isDirectory()) return [dir]
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.name === 'node_modules' || e.name.startsWith('.') ? [] : allFiles(join(dir, e.name)),
  )
}
const candidates = [...allFiles(join(root, 'packages')), ...allFiles(join(root, 'scripts'))]
  .map((f) => relative(root, f))
const isIncluded = picomatch(shippedIncludes)
const isExcluded = shippedExcludes.length ? picomatch(shippedExcludes) : () => false
const shippedFiles = candidates.filter((f) => isIncluded(f) && !isExcluded(f))
const shippedResolves = shippedFiles.length > 0

const args = [
  'vitest', 'run', '--coverage', '--coverage.all',
  ...shippedIncludes.map((p) => `--coverage.include=${p}`),
  `--coverage.include=${rel}/**/*.ts`,
]
let stdout = ''
let stderr = ''
let code = 0
try {
  stdout = execFileSync('npx', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' })
} catch (error) {
  code = error.status ?? 1
  stdout = String(error.stdout ?? '')
  stderr = String(error.stderr ?? '')
}
const output = stdout + stderr
cleanup()

const problems = []
if (!shippedResolves) {
  problems.push(
    `the shipped coverage scope matches ZERO source files after exclude is applied ` +
      `(include: ${shippedIncludes.join(', ') || 'none'}; exclude: ${shippedExcludes.join(', ') || 'none'}), ` +
      'so the real gate measures nothing regardless of thresholds',
  )
}
// Vitest prints this when a coverage threshold is not met. Matching the diagnostic rather than the
// exit code is what separates "the coverage gate fired" from "something else failed".
const THRESHOLD_DIAGNOSTIC = /does not meet (?:global )?threshold/i
if (!THRESHOLD_DIAGNOSTIC.test(output)) {
  problems.push(
    'vitest did not report a coverage threshold failure with a deliberately uncovered module in ' +
      'scope. Either the thresholds are missing from vitest.config.ts (D0014), or coverage is not ' +
      'being collected over the include pattern.',
  )
}
// A failing test would also produce a non-zero exit; that must not read as the gate working.
if (/\d+ failed/.test(output) && !/0 failed/.test(output)) {
  problems.push(
    'the suite had failing tests during this run, so a non-zero exit proves nothing about coverage. ' +
      'Fix the suite, then re-run this prover.',
  )
}
if (code === 0) {
  problems.push('vitest exited 0 with an uncovered module in scope - the threshold is not enforced')
}

if (problems.length) fail('coverage-gate', problems)
pass('coverage-gate', `an uncovered module trips the D0014 thresholds declared in vitest.config.ts (exit ${code})`)
