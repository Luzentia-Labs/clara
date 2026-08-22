/**
 * The mutation gate's CONFIG is checkable today; its SCORE is not.
 *
 * Both packages export `export {}`, so a mutation score over the current source set is
 * meaningless. `grep "break: 70" stryker.conf.json` - the story's authored verifier - proves only
 * that a string was typed, which is the same class of defect this epic has now corrected four
 * times. This asserts the values D0015 fixes AND that the installed Stryker accepts the file.
 */
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fail, pass } from './lib/workspace.mjs'

const problems = []
const conf = JSON.parse(readFileSync('stryker.conf.json', 'utf8'))
let mutateCount = 0
let mutantCount = null

if (conf.thresholds?.break !== 70) {
  problems.push(`thresholds.break is ${conf.thresholds?.break}, D0015 fixes it at 70 and blocking`)
}
// The previous version ran `stryker run --help` and claimed that proved "the installed Stryker
// accepts the file". It does not - `--help` never reads the config, and a review passed this guard
// with `coverageAnalysis: "not-a-real-value"` and a nonexistent plugin (review B4).
//
// The runner is named explicitly rather than auto-discovered, because pnpm's non-flat
// node_modules defeats Stryker's discovery. Assert that, since losing it silently disables the
// entire gate.
if (!(conf.plugins ?? []).includes('@stryker-mutator/vitest-runner')) {
  problems.push(
    'plugins does not name @stryker-mutator/vitest-runner. pnpm\'s non-flat node_modules defeats ' +
      'Stryker\'s auto-discovery, so without the explicit entry the runner never loads and the ' +
      'gate silently does nothing.',
  )
}

// The gate now RUNS. The previous version asserted that a bug file existed, which was a reasonable
// stopgap while it did not - and the wrong one the moment it did. A dry run proves the runner
// discovers tests; without it this guard is back to checking that strings were typed (review B4).

// X9: this assertion was lost in an edit, leaving only the banner CLAIMING the exclusion - which is
// the finding itself. AC3's "Then" names it, so a third of AC3 went unenforced by the guard that
// exists to enforce it. The generated token module is rebuilt every build; mutating it scores noise.
if (!(conf.mutate ?? []).some((m) => m.includes('!packages/tokens/src/generated'))) {
  problems.push(
    'mutate does not exclude packages/tokens/src/generated - that module is regenerated on every ' +
      'build, so mutating it produces a score nobody can act on (US-01M0GM3X AC3).',
  )
}
if (!(conf.vitest && conf.vitest.related === false)) {
  problems.push('vitest.related must be explicitly false (BG-01M0J70K) - it defaults to true and silently finds no tests')
}

try {
  const out = execFileSync('npx', ['stryker', 'run', '--dryRunOnly'], { encoding: 'utf8', stdio: 'pipe' })
  if (!/Initial test run succeeded/.test(out)) {
    problems.push('stryker dry run did not report a successful initial test run')
  }
  // X8: a full run currently generates ZERO mutants, scores `NaN`, and `NaN >= 70` is true - so the
  // gate exits 0 having proven nothing. A threshold that cannot be violated is not a threshold.
  // The mutate surface is empty because both packages export `export {}`; that is expected today
  // and must be VISIBLE rather than dressed as a pass.
  // Y6: this counted FILES. The failure X8 described was zero MUTANTS - two files can instrument to
  // zero mutants, score NaN, and `NaN >= 70` passes. The mutant count is in the same output the
  // guard already reads, one line below the file count. Fourth generation of "assert a proxy for
  // the thing" in this file; now it asserts the thing.
  const files = out.match(/Found (\d+) of \d+ file\(s\) to be mutated/)
  const instrumented = out.match(/Instrumented \d+ source file\(s\) with (\d+) mutant\(s\)/)
  mutateCount = files ? Number(files[1]) : 0
  mutantCount = instrumented ? Number(instrumented[1]) : null
  if (mutantCount === 0) {
    problems.push(
      'stryker instrumented 0 MUTANTS, so a full run scores NaN and `NaN >= 70` passes vacuously. ' +
        'A threshold that cannot be violated is not a threshold.',
    )
  }
  if (mutantCount === null) {
    problems.push('could not read a mutant count from the stryker dry run - the gate cannot be shown to be armed')
  }
} catch (error) {
  const detail = String(error.stdout ?? '') + String(error.stderr ?? '')
  const line = detail.split('\n').find((l) => /ERROR|No tests were/.test(l)) ?? error.message
  problems.push(`stryker could not complete a dry run: ${line.trim().slice(0, 160)}`)
}

if (problems.length) fail('mutation-config', problems)
pass(
  'mutation-config',
  `break=${conf.thresholds.break} blocking, vitest.related=${conf.vitest?.related}, runner named ` +
    `explicitly, generated source excluded, ${mutateCount} file(s) -> ${mutantCount} mutant(s) armed`,
)
