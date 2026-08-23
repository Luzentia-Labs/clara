#!/usr/bin/env node
/**
 * Every file the test runner and the guards actually load must be tracked by git.
 *
 * `test/build/chunk-placement.test.ts` - the end-to-end Vite build that proves chunk placement, and
 * the evidence D0051 cites - was matched by a bare `build/` line in `.gitignore`. It passed on the
 * author's machine for three epics, was never committed, and CI never ran it. Local green and CI
 * green differed by exactly its nine tests, and the difference was invisible until a figure derived
 * from the test count disagreed between the two.
 *
 * That is the worst shape a gap can take: a check that exists, passes, is cited as evidence, and is
 * absent from the only run that matters. A `.gitignore` rule matches by NAME - `build/` cannot tell
 * an output directory from a directory of tests called build - which is the same
 * category-from-a-name failure this repo keeps finding (D0051, D0067, D0074, D0076).
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fail, pass } from './lib/workspace.mjs'

const RULE = 'tracked'
const root = process.cwd()

const tracked = new Set(
  execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean),
)

/** Source that participates in a gate: tests, guards, and the libraries they import. */
const ROOTS = ['packages', 'scripts', 'test', 'apps']
const SOURCE = /\.(ts|tsx|mjs|js|cjs|css|json|md)$/
const SKIP = /(^|\/)(node_modules|dist|coverage|\.turbo|\.stryker-tmp|temp|generated|test-results|\.local)(\/|$)/

const untracked = []
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    const rel = relative(root, full)
    if (SKIP.test(rel)) continue
    if (entry.isDirectory()) { walk(full); continue }
    if (!entry.isFile() || !SOURCE.test(entry.name)) continue
    // Build OUTPUT is legitimately untracked; a test or a guard is not.
    if (!tracked.has(rel) && /\.(test|spec)\.tsx?$/.test(entry.name)) untracked.push(rel)
    else if (!tracked.has(rel) && rel.startsWith('scripts/')) untracked.push(rel)
  }
}
for (const r of ROOTS) {
  try { if (statSync(join(root, r)).isDirectory()) walk(join(root, r)) } catch { /* absent root */ }
}

if (untracked.length) {
  fail(RULE, [
    ...untracked.map((f) => `${f} is loaded by a gate but is NOT tracked by git - CI will never run it`),
    'A gate that runs only on the author\'s machine is not a gate. Check `.gitignore` for a rule matching it by name.',
  ])
}
pass(RULE, `${tracked.size} tracked file(s); every test and guard under ${ROOTS.join(', ')} is committed`)
