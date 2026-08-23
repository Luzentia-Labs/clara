#!/usr/bin/env node
/**
 * Rewrite the measured figures in `sdlc-studio/reviews/LATEST.md` from the repo itself.
 *
 * LATEST.md is the file every agent is told to read first, and it has been wrong twice: it carried
 * "specifications only, no code" for three epics, and then - one commit after being rewritten for
 * exactly that - four stale counts, because the numbers were typed from memory at a moment when
 * they happened to be true. A figure a human types goes stale; a derived one is either right or the
 * command was not run.
 *
 * Deliberately narrow: it replaces NUMBERS on a fixed set of lines and nothing else. The prose is
 * the author's, and a script that rewrote it would be worse than the drift it fixes.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fail, pass } from './lib/workspace.mjs'

const RULE = 'latest-numbers'
const root = process.cwd()
const file = join(root, 'sdlc-studio/reviews/LATEST.md')
if (!existsSync(file)) fail(RULE, ['sdlc-studio/reviews/LATEST.md is missing - it is the orientation file'])

const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
const strip = (s) => s.replace(new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g'), '')

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const guards = pkg.scripts.check.split('&&').length

const tests = /Tests\s+(\d+) passed/.exec(strip(run('npx', ['vitest', 'run', '--silent'])))?.[1]
const mutations = /(\d+) mutation\(s\) killed/.exec(strip(run('node', ['scripts/prove-guards-fail.mjs'])))?.[1]

const decisions = readFileSync(join(root, 'sdlc-studio/decisions.md'), 'utf8')
  .split('\n').filter((l) => /^\| D0\d+ \|/.test(l)).length
const stories = readFileSync(join(root, 'sdlc-studio/stories/_index.md'), 'utf8').split('\n')
const done = stories.filter((l) => l.startsWith('| [US') && / Done /.test(l)).length
const total = stories.filter((l) => l.startsWith('| [US')).length

if (!tests || !mutations) fail(RULE, ['could not measure the test or mutation count - run them directly to see why'])

let text = readFileSync(file, 'utf8')
const before = text
const edits = [
  [/`pnpm check` runs \*\*\d+ guards\*\*/, '`pnpm check` runs **' + guards + ' guards**'],
  [/kills \*\*\d+ mutations\*\*/, 'kills **' + mutations + ' mutations**'],
  [/- \*\*[\d,]+ tests\.\*\*/, '- **' + tests + ' tests.**'],
  [/with [\d,]+ tests and every gate green/, 'with ' + tests + ' tests and every gate green'],
  [/\*\*\d+ decisions\*\*/, '**' + decisions + ' decisions**'],
  [/Stories: \*\*\d+ Done of \d+\*\*/, 'Stories: **' + done + ' Done of ' + total + '**'],
]
const missing = []
for (const [pattern, replacement] of edits) {
  if (!pattern.test(text)) { missing.push(String(pattern)); continue }
  text = text.replace(pattern, replacement)
}
// A pattern matching nothing means the line was reworded and this script silently stopped
// maintaining it - the failure it exists to prevent - so it is an error, not a skip.
if (missing.length) fail(RULE, missing.map((m) => 'no line in LATEST.md matches ' + m + ' - reword it back, or update this script'))

const summary = tests + ' tests, ' + mutations + ' mutations, ' + guards + ' guards, ' + decisions + ' decisions, ' + done + '/' + total + ' stories'
if (process.argv.includes('--check')) {
  if (text !== before) fail(RULE, ['LATEST.md figures are stale - run `node scripts/sync-latest-numbers.mjs`', '  measured: ' + summary])
  pass(RULE, 'LATEST.md figures current: ' + summary)
} else {
  writeFileSync(file, text)
  pass(RULE, 'LATEST.md updated: ' + summary)
}
