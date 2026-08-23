/**
 * Nothing outside a package's own source may be inlined into what it publishes.
 *
 * Two Reacts in one app means two dispatchers, and hooks throw. A workspace dependency compiled in
 * at build time drifts from the version the consumer actually installs. The consumer cannot fix
 * either, and npm releases are immutable.
 *
 * ## Four rewrites, and what each one got wrong
 *
 *   1. Matched React 18 marker strings   -> React 19 renamed them; minifiers strip the rest.
 *   2. Regexed output for a bare `react` -> a `@license` comment saying `from "react"` passed.
 *   3. Gated on the source naming React  -> `jsx: react-jsx` means no component names it, so every
 *                                           peer was skipped on the unmodified tree.
 *   4. Read the bundler's record, but:
 *      a. chose that mode by testing for `vite.config.ts`. Vite also accepts .mts/.cts/.js/.mjs/
 *         .cjs - renaming the file downgraded the guard to "does an entry exist" and 56 KB of
 *         React shipped with the record correctly saying so, unread (review A1).
 *   5. Allowlist over the record - correct, and still defeated, because the FIX for (4a) moved the
 *      filename test into `finalize-dual.mjs`, where it FABRICATED a record claiming a hardcoded
 *      `src/generated/index.ts` for any package without a `vite.config.ts`. Renaming the config and
 *      dropping the plugin produced a 77 KB React-bearing bundle with a synthetic clean record
 *      (review C1). A stale record survived the same way (C2).
 *      b. asked "does this inlined module belong to a package I recognise?" - a DENYLIST keyed on
 *         finding `/node_modules/` in the path. pnpm workspace links are realpathed, so an inlined
 *         `@luzentialabs/clara-tokens` had no `/node_modules/` segment at all and was invisible
 *         (review A2).
 *
 * ## The construction that holds
 *
 * An allowlist, and no mode selection. EVERY published package emits `build/bundle-record.json`
 * (Vite via the plugin, tsc via finalize-dual), a missing record is a failure rather than a
 * different code path, and every module the record lists as inlined must live under that package's
 * own `src/`. Anything else is a finding whether or not this script recognises what it is.
 *
 * A denylist has to enumerate what is forbidden. An allowlist only has to know what is permitted,
 * and this package knows exactly that: its own source.
 */
import { readFileSync, existsSync, realpathSync, readdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, sep, isAbsolute, relative } from 'node:path'
import { fail, pass, readWorkspace } from './lib/workspace.mjs'
import { isClientChunk } from './lib/chunk-plan.mjs'

const root = process.cwd()
const problems = []
let chunksChecked = 0
let modulesChecked = 0
const checked = []
let publishable = 0

/** Rollup reports realpaths; compare against the realpath of src so symlinks cannot fool this. */
const realOrSelf = (p) => {
  try {
    return realpathSync(p)
  } catch {
    return p
  }
}

/** Strip Rollup/Vite virtual-module suffixes: `?commonjs-proxy`, `?used`, `\0` prefixes. */
const cleanId = (id) => id.replace(/^\0/, '').split('?')[0]

for (const { dir, kind, manifest } of readWorkspace(root)) {
  if (kind !== 'packages' || manifest.private) continue
  publishable++
  checked.push(manifest.name.replace('@luzentialabs/clara-', ''))

  const pkgDir = join(root, dir)
  const recordPath = join(pkgDir, 'build/bundle-record.json')

  // No filename check, no alternate branch. A package with no record has not been checked, and
  // "not checked" is never a pass.
  if (!existsSync(recordPath)) {
    problems.push(
      `${manifest.name}: build/bundle-record.json missing. Every published package must emit one - ` +
        'There is exactly ONE record writer - scripts/lib/bundle-record.mjs, a Rollup plugin - and it can ' +
        'only report what a bundler actually did. A package that compiles by other means runs a ' +
        'graph-observing pass (see packages/tokens/record.config.mjs).',
    )
    continue
  }

  let record
  try {
    record = JSON.parse(readFileSync(recordPath, 'utf8'))
  } catch (error) {
    problems.push(`${manifest.name}: bundle-record.json is unreadable (${error.message})`)
    continue
  }

  if (!record.chunks?.length) {
    problems.push(`${manifest.name}: bundle-record.json records no chunks - nothing was checked`)
    continue
  }

  // Bind the record to the artifacts it claims to describe (C1, C2).
  const dist = join(pkgDir, 'dist')
  const walkDist = (dir) =>
    !existsSync(dir)
      ? []
      : readdirSync(dir).flatMap((n) => {
          const f = join(dir, n)
          return statSync(f).isDirectory() ? walkDist(f) : [f]
        })
  const emitted = walkDist(dist).filter((f) => /\.(js|cjs|mjs)$/.test(f))
  const byName = new Map(record.chunks.map((c) => [c.fileName, c]))
    // The reverse direction. The loop below walks files found on DISK and looks each up in the
  // record, which catches "a file exists that the record does not describe" but never "the record
  // describes a file that is not there". With dist deleted entirely it read zero files and still
  // printed "10 chunk(s) hash-matched" - the banner asserting something that did not happen
  // (review F5). Counting record entries is not the same as checking them.
  for (const chunk of record.chunks ?? []) {
    if (!chunk.fileName) continue
    if (!existsSync(join(root, dir, 'dist', chunk.fileName))) {
      problems.push(
        `${manifest.name}: the bundle record describes dist/${chunk.fileName}, which does not ` +
          'exist. The build output is missing or stale, so nothing was verified for it.',
      )
    }
  }

for (const file of emitted) {
    const name = relative(dist, file)
    const chunk = byName.get(name)
    if (!chunk) {
      problems.push(
        `${manifest.name}: dist/${name} was emitted but appears in no bundle record chunk - the ` +
          'record does not describe this build (stale, or written by something that did not build it)',
      )
      continue
    }
    if (!chunk.sha256) {
      problems.push(
        `${manifest.name}: the record entry for ${name} carries no sha256, so it cannot be shown ` +
          'to describe these bytes. Only scripts/lib/bundle-record.mjs may write a record.',
      )
      continue
    }
    const text = readFileSync(file, 'utf8')
    const sha = (t) => createHash('sha256').update(t).digest('hex')
    let actual = sha(text)
    // finalize-dual stamps `"use client"` on the client chunk AFTER Rollup has hashed it (D0041),
    // so an exact match is impossible for that one file. The record is NOT re-derived from the
    // final bytes - that would let any post-build step launder arbitrary changes through, which is
    // the whole hole this record exists to close. Instead the ONE permitted transformation is
    // undone and the result must reproduce the recorded hash exactly. A directive prepend is
    // forgiven; anything else that happened to the file is not.
    // ONLY the client chunk is stamped, so only it may be forgiven. Applied to every chunk, a
    // hand-added directive on clara-shared laundered straight through the hash binding - and
    // that directive alone puts the server chunk behind the client boundary (review F3 r2).
    if (actual !== chunk.sha256 && isClientChunk(chunk.fileName)) {
      // The exact inverse of prependDirective, INCLUDING the shebang case - it puts the directive
      // below a shebang, and an undo that cannot skip one would report "stale or fabricated" for a
      // file nobody tampered with (review F8).
      const undone = text.replace(/^(#![^\n]*\n)?\s*["']use client["'];?\r?\n/, '$1')
      if (undone !== text && sha(undone) === chunk.sha256) actual = chunk.sha256
    }
    if (actual !== chunk.sha256) {
      problems.push(
        `${manifest.name}: dist/${name} does not match its bundle record (recorded ` +
          `${chunk.sha256.slice(0, 12)}..., actual ${actual.slice(0, 12)}...). The record is stale ` +
          'or fabricated; rebuild with the bundleRecord() plugin in place.',
      )
    }
  }

  for (const chunk of record.chunks) {
    chunksChecked++
    if (!Array.isArray(chunk.inlined)) {
      problems.push(`${manifest.name}: chunk ${chunk.fileName} has no inlined module list`)
      continue
    }
    for (const raw of chunk.inlined) {
      modulesChecked++
      const id = cleanId(raw)
      // The allowlist: a package-relative path under its own src/. The plugin writes ids relative
      // to the package root when they fall inside it, so anything still absolute, or escaping via
      // `..`, is by construction from somewhere else.
      if (!isAbsolute(id) && !id.startsWith('..') && id.startsWith(`src${sep}`)) continue

      // Not this package's own source. Name what it looks like, for a useful message - but the
      // finding does not depend on recognising it.
      const marker = '/node_modules/'
      const at = id.lastIndexOf(marker)
      let what = 'a module outside this package'
      if (at !== -1) {
        const parts = id.slice(at + marker.length).split('/')
        what = `"${parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0]}"`
      } else if (id.startsWith(root)) {
        what = `"${id.slice(root.length + 1)}" (another workspace package)`
      }

      problems.push(
        `${manifest.name}: ${what} was INLINED into ${chunk.fileName} (${chunk.format}). ` +
          `Only this package's own src/ may be bundled; declared dependencies and peers must stay ` +
          `external. Inlined from: ${id.length > 120 ? `...${id.slice(-110)}` : id}`,
      )
    }
  }
}

if (problems.length) fail('bundled-peers', problems)
// The banner names the package SET, not just counts: a package silently skipped (a stray
// `private: true`) was previously invisible behind a smaller number (review C3).
pass(
  'bundled-peers',
  `${publishable} package(s) [${checked.join(', ')}], ${chunksChecked} chunk(s) hash-matched, ` +
    `${modulesChecked} inlined module(s), all from own src`,
)
