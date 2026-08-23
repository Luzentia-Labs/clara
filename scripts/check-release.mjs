/**
 * The publish path cannot weaken the gate set.
 *
 * Releases are immutable (AGENTS.md): a bad one is fixed forward, never withdrawn. So the release
 * workflow must run the same gates CI does - a release that skipped one would make that gate
 * advisory, and an immutable artifact is the worst place to discover it.
 *
 * Also asserts what the story's authored verifier only grepped for: publish is main-only, provenance
 * is on in the workflow AND declared per package, and every published package is covered.
 */
import { readFileSync, existsSync } from 'node:fs'
import { fail, pass, readWorkspace } from './lib/workspace.mjs'
import { readWorkflow, commandSet, commandsIn, advisoryReasons } from './lib/workflow.mjs'

const root = process.cwd()
const problems = []
const RELEASE = '.github/workflows/release.yml'
const CI = '.github/workflows/ci.yml'

if (!existsSync(RELEASE)) fail('release', [`${RELEASE} does not exist - there is no publish path`])
if (!existsSync(CI)) fail('release', [`${CI} does not exist - there is nothing to compare the publish path against`])
const release = readWorkflow(RELEASE)
const ci = readWorkflow(CI)
const releaseCommands = commandSet(release)
const ciCommands = commandSet(ci)

// A comparison over an empty set proves nothing and exits 0. The previous version read `run:` with
// an anchored regex, so rewriting any step as a `run: |` block scalar - ordinary YAML the moment a
// step grows a second line - emptied BOTH sides and the guard passed while the publish path ran
// nothing (review C2). Floors first, then the comparison.
if (!ciCommands.size) problems.push(`${CI} parsed to zero commands - the gate comparison would be vacuous`)
if (!releaseCommands.size) problems.push(`${RELEASE} parsed to zero commands - it publishes without gates`)

// Gates the publish path legitimately does not repeat: suites CI owns at PR time, and changeset
// status, which is a PR-time question rather than a publish-time one. Anchored, not loose: the old
// pattern matched `audit` and `playwright` anywhere in a command.
// Deliberately short. Coverage, mutation score and contrast were exempted by a loose regex before
// (review Low); on an immutable artifact "CI already ran it on the PR" is not a reason to skip a
// gate, because the commit that publishes need not be the commit CI saw.
const NOT_REQUIRED_AT_PUBLISH = new Set([
  // A PR-time question: there is no pending changeset left to find once the release job runs.
  'pnpm changeset status --since=origin/main',
])
for (const cmd of ciCommands) {
  if (releaseCommands.has(cmd) || NOT_REQUIRED_AT_PUBLISH.has(cmd)) continue
  problems.push(
    `release.yml does not run "${cmd}", which ci.yml does. A gate the publish path skips is ` +
      'advisory, and a release cannot be taken back.',
  )
}

// A gate that runs but cannot fail the publish is not a gate.
// The job-level `github.ref == main` guard is the main-only restriction itself, not an advisory
// condition - it must not be reported as one.
const MAIN_GUARD = /github\.ref\s*==\s*'refs\/heads\/main'/
for (const step of release.steps) {
  const advisory = advisoryReasons(step).filter((r) => !MAIN_GUARD.test(r))
  const gating = commandsIn(step.run).filter((c) => ciCommands.has(c))
  if (advisory.length && gating.length) {
    problems.push(`release.yml runs "${gating[0]}" without blocking - ${advisory.join('; ')}`)
  }
}

// A step repeated in the publish path costs a full run for nothing. Set comparison cannot see it.
const seen = new Map()
for (const step of release.steps) {
  for (const cmd of commandsIn(step.run)) seen.set(cmd, (seen.get(cmd) ?? 0) + 1)
}
for (const [cmd, n] of seen) {
  if (n > 1) problems.push(`release.yml runs "${cmd}" ${n} times - every publish pays for it twice`)
}

// "Main-only" is a PROPERTY of the trigger set, not a string in the file. The old test was
// /branches:\s*\[main\]/, which a `workflow_dispatch:` addition satisfied while publishing from
// any branch (review C3) - the very thing release.yml's own comment warns about.
const triggers = Object.keys(release.triggers ?? {})
const jobGuards = Object.values(release.jobs).map((j) => String(j?.if ?? ''))
const guardedToMain = jobGuards.some((g) => /github\.ref\s*==\s*'refs\/heads\/main'/.test(g))
for (const trigger of triggers) {
  if (trigger === 'push') {
    const branches = release.triggers.push?.branches ?? []
    if (JSON.stringify(branches) !== JSON.stringify(['main'])) {
      problems.push(`release.yml triggers on push to ${JSON.stringify(branches)} - publishing from a branch is not recoverable`)
    }
  } else if (!guardedToMain) {
    problems.push(
      `release.yml can be triggered by "${trigger}" with no job-level guard that github.ref is ` +
        'refs/heads/main - that is a way to publish from a branch',
    )
  }
}
if (!triggers.length) problems.push('release.yml declares no trigger')

// The publish command itself, wherever it lives - a `with:` key when changesets/action drives it,
// or a `run:` step now that it does not. A `run:`-only reader missed the `with:` form (review M5);
// a `with:`-only reader would miss this one. Both are checked.
// A command that INVOKES a publisher, not a line that merely contains the word - an `echo
// "publishing"` matched first and got reported as the publish command.
const PUBLISH_INVOCATION = /^(?:pnpm|npm|npx|yarn)\b[^\n]*\bpublish\b/
const publishSteps = release.steps.filter((s) =>
  s.with?.publish || commandsIn(s.run).some((c) => PUBLISH_INVOCATION.test(c)))
if (!publishSteps.length) problems.push('release.yml declares no publish command')
for (const step of publishSteps) {
  const cmd = String(step.with?.publish ??
    commandsIn(step.run).find((c) => PUBLISH_INVOCATION.test(c)) ?? '')
  if (!/^pnpm\b/.test(cmd)) {
    problems.push(
      `release.yml publishes with "${cmd}". Only pnpm rewrites the workspace: protocol - npm ships ` +
        'it verbatim and every consumer install then fails with EUNSUPPORTEDPROTOCOL (D0040).',
    )
  }

  // The safety property of the trunk-based flow (D0052). `changeset publish` ships whatever
  // version is in each manifest; with a changeset still pending those versions have NOT been
  // bumped, so it would publish the wrong one - and a release cannot be withdrawn. The guard has
  // to be present, not merely intended.
  if (step.with?.publish) continue // changesets/action sequences version-then-publish itself
  const body = String(step.run ?? '')
  const guardsOnPending = /\.changeset/.test(body) && /exit 0|::notice|if /.test(body)
  if (!guardsOnPending) {
    problems.push(
      'the publish step does not check for a pending changeset first. `changeset publish` ships ' +
        'the version in the manifest, so publishing with one pending ships an un-bumped version, ' +
        'permanently (D0052).',
    )
  }
}

const releaseText = readFileSync(RELEASE, 'utf8')
if (!/id-token:\s*write/.test(releaseText)) {
  problems.push('release.yml lacks `id-token: write`, so npm provenance cannot be attested')
}
if (!/NPM_CONFIG_PROVENANCE/.test(releaseText) && !/provenance/.test(releaseText)) {
  problems.push('release.yml does not enable provenance')
}

// Provenance must also be declared by every published package, or the workflow flag covers nothing.
for (const { kind, manifest } of readWorkspace(root)) {
  if (kind !== 'packages' || manifest.private) continue
  if (manifest.publishConfig?.provenance !== true) {
    problems.push(`${manifest.name}: publishConfig.provenance is not true`)
  }
  if (manifest.publishConfig?.access !== 'public') {
    problems.push(`${manifest.name}: publishConfig.access is not "public" - a scoped package defaults to restricted`)
  }
}

if (!existsSync('CONTRIBUTING.md')) {
  problems.push('CONTRIBUTING.md missing - the breaking-change definition and v1.0 criteria are unwritten (D0025)')
} else {
  const doc = readFileSync('CONTRIBUTING.md', 'utf8')
  for (const [what, re] of [
    ['what counts as breaking', /breaking/i],
    ['the deprecation policy', /deprecat/i],
    ['v1.0 entry criteria', /1\.0/],
    ['the 1.x support window', /support window/i],
  ]) {
    if (!re.test(doc)) problems.push(`CONTRIBUTING.md does not document ${what} (D0025)`)
  }
}

if (problems.length) fail('release', problems)
pass('release', 'publish is main-only, runs CI\'s gates, provenance on in workflow and every manifest, policy documented')
