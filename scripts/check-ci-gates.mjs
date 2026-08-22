#!/usr/bin/env node
// The gate manifest is honest (D0038).
//
// `ci-gates.json` enumerates every gate in TRD Section 9. A gate with a runnable command must
// actually execute in ci.yml AND must block the merge; a gate without one must name a story that
// is still open. A gate that reports without blocking is not a gate.
//
// Rewritten after review C1/H2/H3. The previous version tested `workflow.includes(cmd)` for SOME
// of a gate's `&&`-joined commands, so deleting the `pnpm check` step - the only thing running
// nine deterministic guards, including the sole enforcement point for the exports-wildcard rule -
// still passed, because `pnpm check` is a substring of `pnpm check:contrast`. It also had no
// notion of an advisory step, so `if: false`, `continue-on-error` and `|| true` all passed.
import { readFileSync, existsSync } from 'node:fs'
import { fail, pass } from './lib/workspace.mjs'
import { readWorkflow, commandsIn, commandSet, advisoryReasons, stepRunning } from './lib/workflow.mjs'

const RULE = 'ci-gates'
const CI = '.github/workflows/ci.yml'
const manifest = JSON.parse(readFileSync('ci-gates.json', 'utf8'))
const workflow = readWorkflow(CI)
const running = commandSet(workflow)

const errors = []
const stories = existsSync('sdlc-studio/stories') ? readFileSync('sdlc-studio/stories/_index.md', 'utf8') : ''

// A gate check that enumerates nothing passes for the wrong reason.
if (!manifest.gates?.length) errors.push('ci-gates.json enumerates no gates')
if (!running.size) errors.push(`${CI} runs no commands - the comparison would be vacuous`)

// Every gate in TRD Section 9 must be claimed by a row here, by NUMBER. A count cannot see an
// omission - the manifest had 16 rows against the TRD's 14 and was still missing three, because it
// renumbered rather than covered (review H3, plus two the review did not reach). Fuzzy title
// matching was tried and produced false positives on wording differences, so each row states the
// TRD gate it satisfies and the guard checks the set.
const trd = existsSync('sdlc-studio/trd.md') ? readFileSync('sdlc-studio/trd.md', 'utf8') : ''
const table = trd.split('| # | Gate | Fails when |')[1]
if (!table) errors.push('could not locate the TRD Section 9 gate table - the coverage check would be vacuous')
else {
  const trdGates = [...table.split('\n### ')[0].matchAll(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|/gm)]
    .map(([, n, title]) => ({ n: Number(n), title: title.replace(/[*`]/g, '').trim() }))
  if (!trdGates.length) errors.push('the TRD gate table parsed to zero gates')
  const claimed = new Set(manifest.gates.map((g) => g.trd).filter((n) => typeof n === 'number'))
  for (const g of trdGates) {
    if (!claimed.has(g.n)) errors.push(`TRD Section 9 gate ${g.n} "${g.title}" is claimed by no row in ci-gates.json`)
  }
  const known = new Set(trdGates.map((g) => g.n))
  for (const g of manifest.gates) {
    if (g.trd === undefined) errors.push(`gate ${g.n}: no \`trd\` field - state the TRD gate it satisfies, or null`)
    else if (g.trd !== null && !known.has(g.trd)) errors.push(`gate ${g.n}: claims TRD gate ${g.trd}, which does not exist`)
  }
}

let wired = 0
let pending = 0
for (const gate of manifest.gates) {
  const label = `gate ${gate.n} (${gate.gate.slice(0, 44)})`
  if (gate.status === 'wired') {
    wired++
    if (!gate.run) { errors.push(`${label}: wired but names no command`); continue }
    // EXACT command matching, every command, not some.
    for (const cmd of commandsIn(gate.run)) {
      if (!running.has(cmd)) {
        errors.push(`${label}: declares "${cmd}", which ${CI} does not run`)
        continue
      }
      const step = stepRunning(workflow, cmd)
      const advisory = advisoryReasons(step)
      if (advisory.length) errors.push(`${label}: "${cmd}" runs but does not block - ${advisory.join('; ')}`)
    }
  } else if (gate.status === 'pending') {
    pending++
    if (gate.run) errors.push(`${label}: pending but names a command - wire it or drop the command`)
    const story = gate.blocked_by ?? gate.story
    if (!story) { errors.push(`${label}: pending and names no story`); continue }
    const row = stories.split('\n').find((l) => l.includes(story))
    if (!row) errors.push(`${label}: names ${story}, which is not in the story index`)
    else if (/\b(Done|Cancelled|Superseded)\b/.test(row)) {
      errors.push(`${label}: names ${story}, which is closed - the gate is unowned`)
    }
  } else {
    errors.push(`${label}: status must be wired|pending, got ${gate.status}`)
  }
}

if (errors.length) fail(RULE, errors)
pass(RULE, `${manifest.gates.length} gate(s): ${wired} wired, running and blocking; ${pending} pending and each bound to an open story`)
