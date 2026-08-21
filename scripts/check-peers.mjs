#!/usr/bin/env node
// React is a peer dependency, never a direct one, and the range must cover every major
// Clara claims to support. Two Reacts in a consumer's tree is very hard to diagnose
// downstream and trivial to prevent here. US-01M0GMPJ edge case 4; PRD Section 5.
import { readWorkspace, fail, pass } from './lib/workspace.mjs'

const GUARDED = ['react', 'react-dom']
const SUPPORTED_MAJORS = ['18', '19']       // PRD Section 5 Compatibility
// A package that renders nothing needs no React at all; anything else must declare it as a peer.
const NEEDS_REACT = new Set(['@luzentialabs/clara-icons', '@luzentialabs/clara-react'])

const pkgs = readWorkspace().filter(p => p.kind === 'packages')
const problems = []

for (const { dir, manifest } of pkgs) {
  const name = manifest.name
  const peers = manifest.peerDependencies ?? {}

  for (const g of GUARDED) {
    // React must not reach a consumer's tree through any field that installs it.
    for (const field of ['dependencies', 'optionalDependencies']) {
      if (manifest[field]?.[g]) {
        problems.push(`${dir}: "${g}" is in ${field} - it must be a peerDependency only`)
      }
    }
    if (manifest.bundleDependencies?.includes?.(g) || manifest.bundledDependencies?.includes?.(g)) {
      problems.push(`${dir}: "${g}" is bundled - it would ship inside the tarball`)
    }
  }

  if (!NEEDS_REACT.has(name)) continue

  // The half that was missing: an ABSENT peer passed silently, because the old check only
  // asserted react was not a direct dependency.
  if (!peers.react) {
    problems.push(`${dir}: no "react" peerDependency declared - a consumer gets no compatibility signal`)
    continue
  }
  for (const [dep, range] of Object.entries(peers)) {
    if (!GUARDED.includes(dep)) continue
    // EVERY supported major must appear. The old condition was `!has(18) && !has(19)`, which
    // fired only when NEITHER was present - so narrowing to "^18.2.0" and silently dropping
    // React 19 reported green. Narrowing a peer range is breaking for consumers on the
    // dropped major, which is exactly what this guard exists to catch.
    const missing = SUPPORTED_MAJORS.filter(m => !new RegExp(`(^|[^0-9])${m}\\.`).test(range))
    if (missing.length) {
      problems.push(`${dir}: peer "${dep}": "${range}" does not cover React ${missing.join(' and ')}`)
    }
  }
}

if (problems.length) fail('peers', problems)
pass('peers', `${pkgs.length} package(s), react peer-only and covering ${SUPPORTED_MAJORS.join('/')}`)
