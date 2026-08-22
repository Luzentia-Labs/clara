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

const root = process.cwd()
const problems = []
const RELEASE = '.github/workflows/release.yml'
const CI = '.github/workflows/ci.yml'

if (!existsSync(RELEASE)) fail('release', [`${RELEASE} does not exist - there is no publish path`])
const release = readFileSync(RELEASE, 'utf8')
const ci = existsSync(CI) ? readFileSync(CI, 'utf8') : ''

// Every gate CI runs must also run before publish.
// Matches both `- run:` and `run:` forms. A first version anchored on `run:` alone and missed
// every `- run:` line, so dropping `pnpm check` from the publish path went undetected - the guard
// was reading a fraction of the workflow it claimed to compare.
const ciCommands = [...ci.matchAll(/^\s*(?:-\s*)?run:\s*(pnpm [^\n]+)$/gm)].map((m) => m[1].trim())
// Compare extracted command LISTS, not substrings. `release.includes('pnpm check')` was true
// because release.yml contains `pnpm check:api` - so dropping the `pnpm check` step entirely went
// undetected. A substring test cannot distinguish a command from a prefix of another command.
const extract = (yaml) =>
  new Set([...yaml.matchAll(/^\s*(?:-\s*)?run:\s*(pnpm [^\n]+)$/gm)].flatMap((m) =>
    m[1].split('&&').map((c) => c.trim()),
  ))
const releaseCommands = extract(release)
// Gates the publish path legitimately does not repeat: browser and long-running suites CI owns, and
// changeset status, which is a PR-time question rather than a publish-time one.
const NOT_REQUIRED_AT_PUBLISH = /playwright|changeset status|audit|test:coverage|test:mutation|check:contrast|check:ci-gates|install --frozen/
const skipped = [...extract(ci)].filter((cmd) => !releaseCommands.has(cmd) && !NOT_REQUIRED_AT_PUBLISH.test(cmd))
for (const cmd of skipped) {
  problems.push(
    `release.yml does not run "${cmd}", which ci.yml does. A gate the publish path skips is ` +
      'advisory, and a release cannot be taken back.',
  )
}

if (!/branches:\s*\[main\]/.test(release)) {
  problems.push('release.yml is not restricted to main - publishing from a branch is not recoverable')
}
if (!/id-token:\s*write/.test(release)) {
  problems.push('release.yml lacks `id-token: write`, so npm provenance cannot be attested')
}
if (!/NPM_CONFIG_PROVENANCE/.test(release) && !/provenance/.test(release)) {
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
