#!/usr/bin/env node
// The server/client classification gate (PRD F23, TRD Section 7).
//
// Two independent failures are possible and this guard has to catch both:
//   1. A component ships unclassified. Caught by comparing the built export list against the
//      classification file - the check is driven by what is EXPORTED, never by the list itself,
//      so it cannot go quiet just because the list is short.
//   2. A classified client component ships without its directive. This is the one that bites:
//      Vite's library build DROPS `use client` and downgrades it to a warning, so nothing in the
//      normal build fails. See CR-01M0MK20 - the single-chunk output cannot carry per-component
//      directives at all, which is why the directive half of this guard is still pending.
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fail, pass } from './lib/workspace.mjs'
import { exportedNames } from './lib/exports-read.mjs'

const RULE = 'client-boundary'
const pkg = 'packages/react'
const file = join(pkg, 'client-boundary.json')

if (!existsSync(file)) fail(RULE, [`${file} is missing - the classification is build input, not optional`])
const doc = JSON.parse(readFileSync(file, 'utf8'))

const errors = []
const names = doc.components.map((c) => c.name)
const dupes = names.filter((n, i) => names.indexOf(n) !== i)
if (dupes.length) errors.push(`duplicate entries: ${[...new Set(dupes)].join(', ')}`)
for (const c of doc.components) {
  if (!['server', 'client'].includes(c.boundary)) errors.push(`${c.name}: boundary must be server|client, got ${c.boundary}`)
  if (!['planned', 'built'].includes(c.status)) errors.push(`${c.name}: status must be planned|built, got ${c.status}`)
}

// What the package actually exports. Read from the built ESM, because the classification is a claim
// about shipped output - reading src would let a build-time transform slip a component past.
const dist = join(pkg, 'dist/index.js')
if (!existsSync(dist)) fail(RULE, [`${dist} is missing - build before checking the classification`])
const esm = readFileSync(dist, 'utf8')
const exported = exportedNames(esm)

// A guard that reads nothing exits 0 exactly like a guard that reads everything. If the package
// has a built surface, the reader must find it; if it has none, say so rather than printing a
// confident line about zero (review H5).
const hasSurface = /\bexport\b/.test(esm)
if (hasSurface && !exported.size) {
  errors.push(`${dist} contains exports but the reader extracted none - the classification check would be vacuous`)
}

const classified = new Map(doc.components.map((c) => [c.name, c]))
const unclassified = [...exported].filter((n) => !classified.has(n))
if (unclassified.length) {
  errors.push(`exported but unclassified: ${unclassified.join(', ')}`)
  errors.push('  every component names its boundary before it ships - add it to client-boundary.json')
}

// A component that is exported is built, whatever the file claims.
const mislabelled = [...exported].filter((n) => classified.get(n)?.status === 'planned')
if (mislabelled.length) errors.push(`exported but still marked planned: ${mislabelled.join(', ')}`)

// The directive half. Only meaningful once a client component is actually built.
const builtClients = doc.components.filter((c) => c.boundary === 'client' && c.status === 'built')
if (builtClients.length) {
  const cjs = join(pkg, 'dist/index.cjs')
  if (!existsSync(cjs)) errors.push(`${cjs} is missing - the directive must survive in BOTH formats`)
  else {
    for (const [label, text] of [['ESM', esm], ['CJS', readFileSync(cjs, 'utf8')]]) {
      if (!/^\s*['"]use client['"]/m.test(text)) {
        errors.push(`${label}: ${builtClients.length} client component(s) built but no "use client" survives`)
        errors.push('  Vite drops module-level directives and only warns - see CR-01M0MK20')
      }
    }
  }
}

if (errors.length) fail(RULE, errors)
const counts = { server: 0, client: 0 }
for (const c of doc.components) counts[c.boundary]++
const built = doc.components.filter((c) => c.status === 'built').length
pass(RULE, `${doc.components.length} classified (${counts.server} server, ${counts.client} client), ` +
  `${built} built, ${exported.size} exported, 0 unclassified`)
