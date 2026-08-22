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
 * The entry deliberately stays unchunked and therefore undirectived. That is what keeps the
 * package server-capable: a consumer importing `Box` never crosses a client boundary, and one
 * importing `Button` crosses it exactly at the import.
 */

export const CLIENT_CHUNK = 'clara-client'
export const SERVER_CHUNK = 'clara-server'

/** `.../src/components/<Name>/anything` -> `<Name>`. Anything else -> null. */
export function componentOf (id) {
  if (typeof id !== 'string' || id.startsWith('\0')) return null
  const path = id.replace(/\\/g, '/')
  // A dependency is never ours to chunk, however its own tree happens to be laid out.
  if (path.includes('/node_modules/')) return null
  const m = path.match(/(?:^|\/)src\/components\/([^/]+)\//)
  return m ? m[1] : null
}

/** name -> 'client' | 'server', from the classification document. */
export function boundaryMap (classification) {
  return new Map((classification?.components ?? []).map((c) => [c.name, c.boundary]))
}

/**
 * The chunk a module belongs to, or null to leave it where Rollup puts it.
 *
 * Throws on a component that exists in the tree but not in the classification. Failing the BUILD
 * is the point: `check-client-boundary` catches an unclassified component in the exports, but by
 * then it has already been emitted. Here it never gets built at all.
 */
export function chunkFor (id, boundaries) {
  const name = componentOf(id)
  if (!name) return null
  const boundary = boundaries.get(name)
  if (!boundary) {
    throw new Error(
      `${name} is in src/components but is not classified in client-boundary.json. ` +
        'Every component names its boundary before it builds - a client component that ships ' +
        'unmarked crashes the server render of every App Router consumer.',
    )
  }
  return boundary === 'client' ? CLIENT_CHUNK : SERVER_CHUNK
}

/** The Rollup `manualChunks` callback. */
export function manualChunks (classification) {
  const boundaries = boundaryMap(classification)
  return (id) => chunkFor(id, boundaries)
}
