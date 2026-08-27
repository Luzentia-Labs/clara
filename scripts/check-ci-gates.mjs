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
import { join } from 'node:path'
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

/**
 * `pnpm preflight` must actually mirror CI.
 *
 * It exists so "will this break CI?" is one command rather than a checklist to remember - and it
 * was added after CI went red twice on gates I had not re-run before pushing (the size budget, then
 * the coverage threshold). A hand-written mirror goes stale silently, which would make it worse
 * than no mirror at all: it would answer the question wrongly rather than not answering it.
 *
 * So the mirror is checked here. Anything CI runs must appear in preflight, or be listed below as
 * a deliberate omission with its reason.
 */
const PREFLIGHT_EXEMPT = new Map([
  ['pnpm install --frozen-lockfile', 'the developer already has node_modules; CI starts from nothing'],
  ['pnpm test:mutation', 'minutes-long; run deliberately, and CI is the backstop'],
  ['pnpm verify:consumers', 'installs real tarballs into throwaway apps; slow and network-bound'],
  ['pnpm check:publint && pnpm check:attw', 'downloads two CLIs on every run'],
  ['pnpm audit --audit-level=high --prod', 'network-bound, and advisory data changes independently of this repo, so it can go red with no local change'],
  ['pnpm changeset status --since=origin/main', 'compares against the remote; meaningless before a push'],
  ['pnpm exec playwright install --with-deps chromium', 'downloads a browser; run deliberately'],
  ['pnpm check:geometry', 'gate 9 renders in a real browser (TSD 7); the fast token-level half, `check:density-tokens`, does run in preflight'],
  ['pnpm check:scoping', 'needs a real browser - jsdom does not resolve `var()`, which is the whole subject of the gate'],
  ['pnpm test:e2e', 'needs a browser; run deliberately'],
])
/*
 * A BROWSER GATE MUST BUILD WHAT IT READS.
 *
 * Every playwright suite here reads a built artefact off disk: `build-geometry-fixture.mjs` inlines
 * `packages/react/dist/styles.css`, and the Storybook build imports the same file through the
 * workspace package. Neither is regenerated by `playwright test`, and `storybook build` does NOT
 * build its workspace dependencies - measured: a marker added to `src/styles.css` was absent from
 * `storybook-static` after a Storybook-only build.
 *
 * So a browser gate that does not run `pnpm build` certifies whatever `dist` last held, which may be
 * any tree from any earlier run. A review measured `check:geometry` reporting `10 passed` on a
 * source mutation that its own acceptance criterion names as the thing it must fail on; after
 * `pnpm build` the same gate failed. It was the only browser script with no build, and
 * `check:scoping` and `check:storybook` built Storybook but not the library, which is the same
 * defect one level down.
 *
 * LATEST.md already recorded this class as fixed for `test:e2e`. Fixing one instance of a class and
 * not enumerating the rest is how it comes back, so this rule enumerates them.
 */
const scripts = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')).scripts ?? {}
for (const [name, cmd] of Object.entries(scripts)) {
  if (!/(^|\s)(npx )?playwright test\b/.test(cmd)) continue
  const stages = cmd.split('&&').map((c) => c.trim())
  const playwrightAt = stages.findIndex((c) => /(^|\s)(npx )?playwright test\b/.test(c))
  const buildsBefore = stages.slice(0, playwrightAt).some((c) => c === 'pnpm build')
  if (!buildsBefore) {
    errors.push(`"${name}" runs playwright without \`pnpm build\` first, so it certifies whatever packages/react/dist last held rather than the source`)
  }
  // A suite served from `storybook-static` needs that rebuilt too, and the Storybook build does not
  // build its workspace dependencies - so BOTH builds are required, in that order.
  if (/storybook/i.test(name) || /scoping/.test(name) || cmd.includes('storybook-static')) {
    const buildsStorybook = stages.slice(0, playwrightAt)
      .some((c) => c.includes('@clara-internal/storybook') && c.includes('build'))
    if (!buildsStorybook) {
      errors.push(`"${name}" reads a Storybook build it does not rebuild`)
    }
  }
}

const preflight = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')).scripts?.preflight
if (!preflight) {
  errors.push('package.json has no `preflight` script - the one command that mirrors CI')
} else {
  // Exact command matching, via the same reader the gate-wiring half uses. A `.includes` test is
  // the substring bug this file's header describes fixing, and it came straight back: `pnpm check`
  // was satisfied by the presence of `pnpm check:component-css`, so the whole guard suite and the
  // whole test suite could each be dropped from preflight with this check green.
  const inPreflight = new Set(commandsIn(preflight))
  // Every step in the workflow, not one hard-coded job id: renaming or splitting the job silently
  // emptied the loop and the check stopped checking without saying so.
  for (const step of workflow.steps ?? []) {
    const cmd = (step.run ?? '').trim()
    if (!cmd || (!cmd.startsWith('pnpm') && !cmd.startsWith('node'))) continue
    if (PREFLIGHT_EXEMPT.has(cmd)) continue
    if (!cmd.split('&&').map((c) => c.trim()).every((c) => inPreflight.has(c))) {
      errors.push(`preflight does not run "${cmd}", which ${CI} does - add it, or exempt it with a reason`)
    }
  }
}

if (errors.length) fail(RULE, errors)
pass(RULE, `${manifest.gates.length} gate(s): ${wired} wired, running and blocking; ${pending} pending and each bound to an open story`)
