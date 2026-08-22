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
import { prependDirective } from './directive.mjs'
import { CLIENT_CHUNK } from './chunk-plan.mjs'
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

// The "no directive anywhere else" half is NOT re-checked here.
//
// It used to be, and worse than the guard that owns it: the entry check read only index.js (never
// index.cjs), looked at the first 200 characters, and used an unanchored pattern built by string
// substitution, so it matched the words anywhere in that window rather than as the first
// statement; the server-chunk check was a bare /use client/ over the whole file, which fails a
// build for a component whose own documentation contains the phrase (review F10). Duplicated logic
// with weaker semantics reads as defence in depth and is not. `check-client-boundary.mjs` owns it:
// an anchored pattern over both formats, across the entry, the server chunk and the shared chunk -
// the last of which this comment claimed was covered before it actually was (review F3 r2).

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
