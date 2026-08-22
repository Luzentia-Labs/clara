/**
 * A Rollup/Vite plugin that records what the bundler ACTUALLY did.
 *
 * Three generations of the peer guard failed because each one *inferred* externalization from
 * something other than the bundler:
 *
 *   1. Matched React 18 marker strings      -> React 19 renamed them, minifier stripped the rest.
 *   2. Regexed output for a bare specifier  -> a `@license` comment saying `from "react"` passed.
 *   3. Gated on the source importing React  -> `jsx: react-jsx` means no component ever names it,
 *                                              so every peer was skipped on the unmodified tree.
 *
 * Rollup already knows the answer and does not have to be guessed at. In `generateBundle`,
 * `chunk.modules` is keyed by the absolute path of every module that was INLINED into that chunk,
 * and `chunk.imports` lists what stayed EXTERNAL. Those are facts about the build, not a
 * classification anyone chose, and they are immune to minification, comments, the JSX transform,
 * and transitive workspace inlining.
 */
import { writeFileSync, mkdirSync, realpathSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, resolve, relative, isAbsolute } from 'node:path'

/**
 * Module ids are recorded RELATIVE to the package root when they fall inside it, absolute
 * otherwise. That makes the record portable - the guard can check it from a staged copy or another
 * machine - and it makes "outside this package" visible in the data itself rather than something
 * the reader has to recompute from two absolute paths.
 */
function toPackageRelative (id, pkgRoot) {
  const clean = id.replace(/^\0/, '').split('?')[0]
  let resolved = clean
  try {
    if (isAbsolute(clean)) resolved = realpathSync(clean)
  } catch {
    // unresolvable ids stay as written
  }
  const rel = relative(pkgRoot, resolved)
  return !rel.startsWith('..') && !isAbsolute(rel) ? rel : resolved
}

/**
 * @param {object}   [opts]
 * @param {string}   [opts.outFile]
 * @param {string[]} [opts.describeArtifacts]
 *   Real emitted files this record describes, when the bundler runs only to OBSERVE a graph that
 *   another tool compiled - `clara-tokens` is built by Style Dictionary + tsc (D0028), so a Rollup
 *   pass over its source proves nothing foreign is imported, while the bytes that ship come from
 *   tsc. Given this, the record carries the observed module graph bound to the hashes of the REAL
 *   artifacts. Both halves are observed; neither is asserted.
 */
export function bundleRecord ({ outFile = 'build/bundle-record.json', describeArtifacts = [] } = {}) {
  const pkgRoot = realpathSync(process.cwd())
  let chunks = []
  return {
    name: 'clara:bundle-record',
    // Reset per build. Without this, `vite build --watch` appends to the previous run's array and
    // the record becomes a union of every build in the session, describing output that no longer
    // exists (review A3 - measured 2 -> 4 -> 6 chunks across three rebuilds).
    buildStart () {
      chunks = []
    },
    generateBundle (_options, bundle) {
      for (const [fileName, output] of Object.entries(bundle)) {
        if (output.type !== 'chunk') continue
        chunks.push({
          fileName,
          // The record is bound to the bytes it describes. Without this, a record could be stale
          // (a later `vite build` with no clean leaves the old one in place, describing output that
          // no longer exists) or fabricated outright by something that never ran a bundler - both
          // observed defeating this guard (review C1, C2). A hash makes "not checked" impossible to
          // represent as "checked": a record that does not name the real bytes is a failure.
          sha256: createHash('sha256').update(output.code ?? '').digest('hex'),
          format: _options.format,
          // Absolute paths of every module inlined into this chunk.
          inlined: Object.keys(output.modules).map((id) => toPackageRelative(id, pkgRoot)),
          // Specifiers left for the consumer's bundler to resolve.
          external: [...(output.imports ?? []), ...(output.dynamicImports ?? [])],
        })
      }
    },
    closeBundle () {
      let recorded = chunks
      if (describeArtifacts.length) {
        // One observed graph, bound to the real shipped bytes.
        const observed = [...new Set(chunks.flatMap((c) => c.inlined))]
        const external = [...new Set(chunks.flatMap((c) => c.external))]
        recorded = describeArtifacts.map((rel) => ({
          fileName: rel.replace(/^dist\//, ''),
          sha256: createHash('sha256').update(readFileSync(resolve(rel), 'utf8')).digest('hex'),
          format: rel.endsWith('.cjs') ? 'cjs' : 'es',
          observedBy: 'rollup-graph-pass',
          inlined: observed,
          external,
        }))
      }
      const path = resolve(outFile)
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, JSON.stringify({ chunks: recorded }, null, 2) + '\n')
    },
  }
}
