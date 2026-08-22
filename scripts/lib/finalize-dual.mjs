/**
 * Finalize a dual ESM/CJS package build.
 *
 * Two jobs, both of which exist because "type": "module" makes the file extension the thing that
 * decides how Node reads a file:
 *
 *   1. Rename the CJS pass output (`<dist>/.cjs/*.js`) to `<dist>/*.cjs`.
 *   2. Copy `<dist>/index.d.ts` to `<dist>/index.d.cts`.
 *
 * Job 2 is the fix for BG-01M0HTRM. Under "type": "module", a single `index.d.ts` served to both
 * the import and require conditions hands a `require` consumer ESM-shaped declarations - the attw
 * case attw reports as FalseESM, which TRD Section 9 gate 10 fails on. The declaration CONTENT
 * is identical; only
 * the extension, and therefore the module system Node infers, differs.
 *
 * Usage: node finalize-dual.mjs <packageDir>
 */
import { readdirSync, renameSync, copyFileSync, rmSync, existsSync, statSync, readFileSync, writeFileSync } from 'node:fs'
import { applyCascadeLayer } from './cascade-layer.mjs'
import { prependDirective, rewriteCjsSpecifiers, USE_CLIENT } from './directive.mjs'
import { CLIENT_CHUNK, SERVER_CHUNK } from './chunk-plan.mjs'
import { join, resolve } from 'node:path'

const walkCss = (dir) =>
  !existsSync(dir)
    ? []
    : readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walkCss(join(dir, e.name)) : e.name.endsWith('.css') ? [join(dir, e.name)] : [],
      )

const pkgDir = resolve(process.argv[2] ?? '.')
const dist = join(pkgDir, 'dist')
const cjsStage = join(dist, '.cjs')

if (!existsSync(dist)) {
  console.error(`FAIL [finalize] no dist/ in ${pkgDir} - run the build first`)
  process.exit(1)
}

let renamed = 0
if (existsSync(cjsStage)) {
  for (const name of readdirSync(cjsStage)) {
    const from = join(cjsStage, name)
    if (statSync(from).isDirectory()) {
      console.error(`FAIL [finalize] unexpected directory in the CJS stage: ${name}`)
      console.error('  The CJS pass must emit a flat, single-module output. A nested directory')
      console.error('  means an internal import survived, and renaming .js -> .cjs would break it.')
      process.exit(1)
    }
    if (!name.endsWith('.js')) continue
    renameSync(from, join(dist, name.replace(/\.js$/, '.cjs')))
    renamed++
  }
  rmSync(cjsStage, { recursive: true, force: true })
}

// The manifest's `require` condition promises dist/index.cjs. Without this check the script
// printed PASS for an ESM-only build whose require path resolved to nothing - publint caught it,
// but this script's own docblock claimed to have finalized a dual build (review F10).
const cjs = join(dist, 'index.cjs')
if (!existsSync(cjs)) {
  console.error('FAIL [finalize] dist/index.cjs missing - this is not a dual build')
  console.error('  The package manifest\'s `require` condition points at it. Check that the')
  console.error("  build emits both formats (vite: build.lib.formats must include 'cjs').")
  process.exit(1)
}

const dts = join(dist, 'index.d.ts')
if (!existsSync(dts)) {
  console.error('FAIL [finalize] dist/index.d.ts missing - nothing to derive index.d.cts from')
  process.exit(1)
}
copyFileSync(dts, join(dist, 'index.d.cts'))

// D0041: the `"use client"` directive is stamped on the client chunk and NOWHERE else.
//
// Done here rather than in the bundler because Rollup drops module-level directives and only
// warns - the source cannot carry it. Stamping the chunk is what makes `client-boundary.json`
// load-bearing build input: the list cuts the chunk, and the chunk is what gets marked, so the
// classification and the shipped output cannot disagree.
//
// The entry is deliberately NOT stamped. That is what keeps the package server-capable: a
// consumer importing Box never crosses a client boundary, and one importing Button crosses it
// exactly at the import. TRD Section 7 requires both halves.
let stamped = 0
for (const ext of ['js', 'cjs']) {
  const clientChunk = join(dist, `${CLIENT_CHUNK}.${ext}`)
  if (!existsSync(clientChunk)) continue
  const before = readFileSync(clientChunk, 'utf8')
  const after = prependDirective(before)
  if (after !== before) {
    writeFileSync(clientChunk, after)
    stamped++
  }
}

// Anything the rename step left pointing at a `.js` that no longer exists. The build names CJS
// chunks `.cjs` directly, so this is normally a no-op - it is here because the failure mode is
// MODULE_NOT_FOUND on a consumer's first require, and a silent no-op costs nothing.
for (const name of readdirSync(dist)) {
  if (!name.endsWith('.cjs')) continue
  const file = join(dist, name)
  const before = readFileSync(file, 'utf8')
  const after = rewriteCjsSpecifiers(before)
  if (after !== before) writeFileSync(file, after)
}

// The server chunk must carry no directive, or the classification is a lie in the other
// direction: every consumer is forced into a client boundary, which is what F23 exists to prevent.
for (const ext of ['js', 'cjs']) {
  const serverChunk = join(dist, `${SERVER_CHUNK}.${ext}`)
  if (existsSync(serverChunk) && /use client/.test(readFileSync(serverChunk, 'utf8'))) {
    console.error(`FAIL [finalize] ${SERVER_CHUNK}.${ext} carries a "use client" directive`)
    console.error('  Server-capable components carry NO directive (TRD Section 7). A directive here')
    console.error('  forces every consumer into a client boundary.')
    process.exit(1)
  }
}
const entry = join(dist, 'index.js')
if (existsSync(entry) && new RegExp(USE_CLIENT.replace(/[".;]/g, '.')).test(readFileSync(entry, 'utf8').slice(0, 200))) {
  console.error('FAIL [finalize] the entry carries a "use client" directive')
  console.error('  The entry must stay server-capable so the boundary forms at the component import.')
  process.exit(1)
}

// D0005 / TRD:318: every emitted Clara stylesheet is wrapped in the cascade layer. Done HERE, in
// the step every package already runs last, rather than in each bundler's own hooks - a Vite plugin
// ran before Vite's own CSS emit and silently did nothing, and a per-pipeline mechanism is one more
// place a future package can skip. This cannot be retrofitted after release (AGENTS.md), so it must
// not be possible to add a package that misses it.
let layered = 0
for (const file of walkCss(dist)) {
  const before = readFileSync(file, 'utf8')
  const after = applyCascadeLayer(before, 'clara.components')
  if (after !== before) {
    writeFileSync(file, after)
    layered++
  }
}

console.log(
  `PASS [finalize] ${renamed} file(s) -> .cjs, dual output present, index.d.cts written` +
    (layered ? `, ${layered} stylesheet(s) wrapped in clara.components` : '') +
    `, ${stamped} client chunk(s) stamped "use client", server chunk and entry clean`,
)
