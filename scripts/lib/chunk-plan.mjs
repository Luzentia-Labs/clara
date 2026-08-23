/**
 * Cut the build into a client chunk and a server chunk, driven by the classification.
 *
 * This is the mechanism behind D0041. A bundle has one top, so a single chunk can carry the
 * `"use client"` directive for everything or for nothing - and TRD Section 7 requires it on client
 * components AND absent from server-capable ones. Two chunks can express that; one cannot.
 *
 * The important property is the direction of control: `client-boundary.json` is the INPUT to the
 * build, not a description of it. The list and the shipped output cannot disagree, because the
 * list is what cuts the chunks.
 *
 * Placement is decided by **what a module DEFINES**, not by which directory it sits in. Keying on
 * the directory was wrong in both directions (review F1): a client component co-located with a
 * server one - `src/components/Table/TableSortButton.tsx`, which the classification's own
 * `special.Table` entry describes - chunked as `Table` and shipped undirectived; and a flat
 * `src/components/Switch.tsx` matched no component directory at all, so it was inlined into the
 * ENTRY, the one file that must stay undirectived.
 *
 * The entry deliberately stays unchunked and therefore undirectived. That is what keeps the
 * package server-capable: a consumer importing `Box` never crosses a client boundary, and one
 * importing `Button` crosses it exactly at the import.
 */
import { readFileSync, existsSync } from 'node:fs'
import { componentsIn } from './module-exports.mjs'

export const CLIENT_CHUNK = 'clara-client'
export const SERVER_CHUNK = 'clara-server'
// Own-source modules that define no component - a `cx` helper, a hook, a constant - go here rather
// than being left to Rollup. Left unplaced, Rollup folds a module shared by a client and a server
// component into ONE of the two chunks, chosen by module-graph order: reordering two lines in
// `src/index.ts` was enough to move `cx` into the client chunk, at which point the server chunk
// imported it and every server-capable component sat behind the client boundary (review F2). Under
// RSC every export of a `"use client"` module is a client reference, so the server render throws.
// A third chunk carries no directive, so both sides may import it and neither owns it.
export const SHARED_CHUNK = 'clara-shared'

/** Is this a module of ours, rather than a dependency or a bundler virtual? */
export function isOwnSource (id) {
  if (typeof id !== 'string' || id.startsWith('\0')) return false
  const path = id.replace(/\\/g, '/')
  if (path.includes('/node_modules/')) return false
  return /\/src\/.*\.(ts|tsx|js|jsx)$/.test(path) || /^src\/.*\.(ts|tsx|js|jsx)$/.test(path)
}

/**
 * Is this EMITTED file a client chunk?
 *
 * One definition, used by the finalizer and by the guard, so "which files must carry the
 * directive" cannot drift between the thing that stamps them and the thing that checks them.
 * Matches `clara-client-<Component>.{js,cjs}` and the legacy single `clara-client.{js,cjs}`.
 */
export const isClientChunk = (fileName) =>
  new RegExp(`^${CLIENT_CHUNK}(?:-[A-Za-z0-9_$]+)?\\.(?:js|cjs)$`).test(fileName)

/** name -> 'client' | 'server', from the classification document. */
export function boundaryMap (classification) {
  return new Map((classification?.components ?? []).map((c) => [c.name, c.boundary]))
}

/**
 * The chunk a module belongs to, or null to leave it where Rollup puts it.
 *
 * `read` is injected so this stays testable without a filesystem.
 */
export function chunkFor (id, boundaries, read = defaultRead) {
  if (!isOwnSource(id)) return null
  // The entry stays the entry. Folding it into the shared chunk works, but leaves dist/index.js an
  // empty facade, which makes the output harder to reason about than it needs to be.
  if (isEntry(id)) return null
  const source = read(id)
  if (source == null) return null

  const defined = [...componentsIn(source, id)]
  const known = defined.filter((n) => boundaries.has(n))
  const unknown = defined.filter((n) => !boundaries.has(n))
  if (unknown.includes('default') && looksLikeComponentModule(id)) {
    throw new Error(
      `${id} has an ANONYMOUS default export. A component is classified by name, so an unnamed one ` +
        'can never be classified - and an unclassified client component reaches the undirectived ' +
        'shared chunk. Name it: `const Thing = () => ...; export default Thing`.',
    )
  }
  if (unknown.length && !known.length && looksLikeComponentModule(id)) {
    throw new Error(
      `${id} defines ${unknown.join(', ')}, which ${unknown.length > 1 ? 'are' : 'is'} not classified in ` +
        'client-boundary.json. Every component names its boundary before it builds - a client ' +
        'component that ships unmarked crashes the server render of every App Router consumer.',
    )
  }
  if (!known.length) return SHARED_CHUNK

  const boundariesFound = new Set(known.map((n) => boundaries.get(n)))
  if (boundariesFound.size > 1) {
    // One module cannot be both: it gets one directive or none, whichever chunk it lands in.
    throw new Error(
      `${id} defines components on BOTH sides of the boundary (${known.map((n) => `${n}:${boundaries.get(n)}`).join(', ')}). ` +
        'A module receives one directive or none, so split it into a client file and a server file.',
    )
  }
  if (!boundariesFound.has('client')) return SERVER_CHUNK
  // D0048: one chunk PER client component. `use client` boundaries are module-granular, so a
  // single client chunk makes a consumer importing Button take every other client component into
  // their client bundle - which contradicts the per-component JS budgets AGENTS.md declares.
  // Server components stay together on purpose: they carry no directive, so a shared server chunk
  // crosses no boundary and costs a consumer only bytes their bundler can tree-shake.
  //
  // Sorted, so a module defining more than one client component gets a name that does not depend
  // on declaration order - a chunk whose name moves between builds breaks the size budgets and the
  // bundle record that address it.
  const owner = known.filter((n) => boundaries.get(n) === 'client').sort()[0]
  return `${CLIENT_CHUNK}-${owner}`
}

// The suffix heuristic that used to live here - /Props$|Context$|Provider$|Ref$|Type$|Options$/ -
// is gone. It silently excluded every `*Provider`, and a React context Provider is client-only by
// definition, so `ThemeProvider` was dropped into the undirectived shared chunk. A component is now
// identified by what it IS - a function-like value export with a capitalised name, per the
// TypeScript parser - rather than by how its name is spelled. That also stops
// `export const BUTTON_VARIANTS = [...]` from hard-failing the build as an unclassified component.

const isEntry = (id) => /(?:^|\/)src\/index\.tsx?$/.test(id.replace(/\\/g, '/'))

const looksLikeComponentModule = (id) => id.replace(/\\/g, '/').includes('/src/components/') ||
  id.replace(/\\/g, '/').startsWith('src/components/')

const defaultRead = (id) => (existsSync(id) ? readFileSync(id, 'utf8') : null)

/** The Rollup `manualChunks` callback. */
export function manualChunks (classification) {
  const boundaries = boundaryMap(classification)
  return (id) => chunkFor(id, boundaries)
}
