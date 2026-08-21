#!/usr/bin/env node
// Clara's layering is one-directional: tokens <- icons <- react (TRD Section 3).
// A consumer can adopt clara-tokens alone and style their own markup - which only
// holds if the lower layers never reach upward. This asserts that, and that the
// graph is acyclic. US-01M0GMPJ AC3 / edge case 2.
import { readWorkspace, fail, pass } from './lib/workspace.mjs'

const ORDER = ['@luzentialabs/clara-tokens', '@luzentialabs/clara-icons', '@luzentialabs/clara-react']
const rank = new Map(ORDER.map((n, i) => [n, i]))

const pkgs = readWorkspace().filter(p => p.kind === 'packages')
const violations = []
const edges = new Map()

const workspaceNames = new Set(pkgs.map(p => p.manifest.name))

for (const { dir, manifest } of pkgs) {
  const name = manifest.name
  // Every intra-workspace edge, including devDependencies (a dev edge still creates a
  // build-order cycle) and including packages absent from ORDER. Filtering to the three
  // known names before cycle detection made a real cycle through any fourth package
  // invisible - the DFS below ran, but the edges had already been removed.
  const deps = Object.keys({
    ...manifest.dependencies, ...manifest.peerDependencies, ...manifest.devDependencies,
  }).filter(d => workspaceNames.has(d))
  edges.set(name, deps)

  if (!rank.has(name)) {
    // A package nobody assigned a layer to is not exempt - it is unreviewed.
    violations.push(`${dir}: "${name}" is not in the declared layer order - add it to ORDER in this script, or the layer rule does not apply to it`)
    continue
  }
  for (const dep of deps) {
    if (!rank.has(dep)) continue
    if (rank.get(dep) >= rank.get(name)) {
      violations.push(`${dir}: ${name} depends on ${dep} - that is upward or sideways in the layer order`)
    }
  }
}

// cycle detection, independent of the declared order
const state = new Map()
const walk = (n, path) => {
  if (state.get(n) === 'done') return
  if (state.get(n) === 'open') { violations.push(`cycle: ${[...path, n].join(' -> ')}`); return }
  state.set(n, 'open')
  for (const d of edges.get(n) ?? []) walk(d, [...path, n])
  state.set(n, 'done')
}
for (const n of edges.keys()) walk(n, [])

if (violations.length) {
  fail('layers', [...new Set(violations)].concat(
    '', `declared order (low to high): ${ORDER.join(' <- ')}`))
}
pass('layers', `${pkgs.length} package(s), order holds, no cycle`)
