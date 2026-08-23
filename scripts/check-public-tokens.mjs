#!/usr/bin/env node
/**
 * Docs and examples reference only tier 2 (TRD Section 9 gate 8, PRD F01, D0007).
 *
 * Tier 2 is public API and covered by the breaking-change rule; tiers 1 and 3 may change in a
 * minor. That distinction is an honour system until something checks it - and the thing that
 * breaks it is not malice, it is a docs example reaching for `--clara-color-neutral-600` because
 * it happened to be the right grey. Once that ships in a copyable example, consumers depend on it,
 * and a private token becomes public by accident.
 *
 * Scanned: the docs app and every markdown file that shows tokens. What is checked is any
 * `--clara-*` custom property REFERENCE, resolved against the generated public manifest.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fail, pass } from './lib/workspace.mjs'

const RULE = 'public-tokens'
const root = process.cwd()
const manifestPath = join(root, 'packages/tokens/dist/tokens.public.json')
if (!existsSync(manifestPath)) {
  fail(RULE, ['packages/tokens/dist/tokens.public.json missing - build the tokens first'])
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
// The manifest is keyed by the TS constant name (`ColorFgDefault`); a doc writes the CSS custom
// property (`--clara-color-fg-default`). Derived from the tier MANIFEST, which carries both forms,
// rather than by un-camel-casing the key - that transformation is lossy on a name like
// `ColorBgRowStriped`, and a public token it fails to reconstruct reads as private, so a correct
// doc gets rejected.
const tierManifestPath = join(root, 'packages/tokens/build/tier-manifest.json')
if (!existsSync(tierManifestPath)) {
  fail(RULE, ['packages/tokens/build/tier-manifest.json missing - build the tokens first'])
}
const tiers = JSON.parse(readFileSync(tierManifestPath, 'utf8'))
const publicVars = new Set(tiers.tier2.map((t) => `--clara-${t.name}`))
const privateVars = new Set(tiers.tier1.map((t) => `--clara-${t.name}`))
if (publicVars.size !== Object.keys(manifest).length) {
  fail(RULE, [
    `the tier manifest lists ${publicVars.size} tier 2 token(s) but tokens.public.json has ` +
      `${Object.keys(manifest).length} - the two disagree about what is public, so this gate cannot be trusted`,
  ])
}

const SCANNED = ['apps/docs', 'design', 'README.md', 'CONTRIBUTING.md']
const walk = (p) => {
  if (!existsSync(p)) return []
  if (statSync(p).isFile()) return [p]
  return readdirSync(p).flatMap((e) => (e === 'node_modules' || e.startsWith('.') ? [] : walk(join(p, e))))
}
const files = SCANNED.flatMap((s) => walk(join(root, s)))
  .filter((f) => /\.(md|mdx|tsx?|jsx?|css|html)$/.test(f))

const problems = []
let referenced = 0
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(/--clara-[a-z0-9-]+/g)) {
    const name = m[0]
    referenced++
    if (publicVars.has(name)) continue
    const tier = privateVars.has(name) ? 'tier 1 (primitive)' : 'not a token this build emits'
    problems.push(`${relative(root, file)}: references ${name} - ${tier}, not tier 2`)
    problems.push('  tiers 1 and 3 are private and may change in a minor (D0007) - use a tier 2 token')
  }
}

// A scan that matched no reference has verified nothing. The docs exist to show tokens; if none
// are mentioned, either the docs are missing or the scan is pointed at the wrong place.
if (!referenced) {
  problems.push(`no --clara- token reference found in ${files.length} scanned file(s) - this gate checked nothing`)
}
if (problems.length) fail(RULE, [...new Set(problems)])
pass(RULE, `${files.length} doc/example file(s) scanned, ${referenced} token reference(s), all tier 2 (${publicVars.size} public)`)
