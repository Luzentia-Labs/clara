import { describe, it, expect } from 'vitest'
// @ts-expect-error - .mjs sibling
import { isOwnSource, chunkFor, boundaryMap, CLIENT_CHUNK, SERVER_CHUNK, SHARED_CHUNK } from '../chunk-plan.mjs'

const classification = {
  components: [
    { name: 'Button', boundary: 'client', status: 'built' },
    { name: 'Box', boundary: 'server', status: 'built' },
    { name: 'Table', boundary: 'server', status: 'planned' },
    { name: 'TableSortButton', boundary: 'client', status: 'planned' },
  ],
}
const boundaries = boundaryMap(classification)

const SOURCES: Record<string, string> = {
  'src/components/Button/Button.tsx': 'export function Button () {}',
  'src/components/Box/Box.tsx': 'export function Box () {}',
  // Co-location: a client component living inside a server component's directory. Keying on the
  // DIRECTORY put this in the server chunk, undirectived.
  'src/components/Table/Table.tsx': 'export function Table () {}',
  'src/components/Table/TableSortButton.tsx': 'export function TableSortButton () {}',
  // A flat file under components/ matched no component directory and was inlined into the ENTRY.
  'src/components/Switch.tsx': 'export function Switch () {}',
  'src/lib/cx.ts': 'export const cx = () => 1',
  'src/index.ts': "export { Box } from './components/Box/Box'",
  'src/components/Ghost/Ghost.tsx': 'export function Ghost () {}',
  'src/components/Mixed/Mixed.tsx': 'export function Button () {}\nexport function Box () {}',
  'src/components/Button/ButtonProps.ts': 'export interface ButtonProps { a: string }',
}
const read = (id: string) => SOURCES[id] ?? null

// These names are the coupling between vite.config.ts, finalize-dual.mjs and
// check-client-boundary.mjs. Mutating either constant to "" survived every test, so they are
// pinned here (review F6).
describe('chunk names', () => {
  it('are the exact strings the build and the guards agree on', () => {
    expect(CLIENT_CHUNK).toBe('clara-client')
    expect(SERVER_CHUNK).toBe('clara-server')
    expect(SHARED_CHUNK).toBe('clara-shared')
  })

  it('are all distinct, or one chunk would silently absorb another', () => {
    expect(new Set([CLIENT_CHUNK, SERVER_CHUNK, SHARED_CHUNK]).size).toBe(3)
  })
})

describe('isOwnSource', () => {
  it.each(['src/components/Box/Box.tsx', '/repo/packages/react/src/lib/cx.ts'])('accepts %s', (id) => {
    expect(isOwnSource(id)).toBe(true)
  })

  it.each(['\0virtual:x', '/repo/node_modules/react/index.js', 'src/styles.css'])('rejects %s', (id) => {
    expect(isOwnSource(id)).toBe(false)
  })

  it('handles backslash separators', () => {
    expect(isOwnSource('packages\\react\\src\\components\\Box\\Box.tsx')).toBe(true)
  })
})

describe('chunkFor', () => {
  it.each([
    ['a client component', 'src/components/Button/Button.tsx', CLIENT_CHUNK],
    ['a server component', 'src/components/Box/Box.tsx', SERVER_CHUNK],
    // The two placements that were wrong when this keyed on the directory.
    ['a client component co-located under a server component', 'src/components/Table/TableSortButton.tsx', CLIENT_CHUNK],
    ['a server component beside a client one', 'src/components/Table/Table.tsx', SERVER_CHUNK],
    // A flat file matched no component directory, so it was inlined into the ENTRY - the one
    // file that must stay undirectived. Keyed on what it DEFINES, it lands correctly.
    ['a flat client component file', 'src/components/Switch.tsx', CLIENT_CHUNK],
  ])('places %s', (_label, id, expected) => {
    expect(chunkFor(id, boundaryMap({ components: [...classification.components, { name: 'Switch', boundary: 'client' }] }), read)).toBe(expected)
  })

  // A module shared by both sides goes to a chunk NEITHER owns. Left unplaced, Rollup folds it
  // into one of the two by graph order, and when that was the client chunk the server chunk
  // imported it - putting server-capable code behind the client boundary (review F2).
  it('puts a shared helper in the shared chunk, which carries no directive', () => {
    expect(chunkFor('src/lib/cx.ts', boundaries, read)).toBe(SHARED_CHUNK)
  })

  it('leaves the entry unchunked so dist/index.js stays the real entry', () => {
    expect(chunkFor('src/index.ts', boundaries, read)).toBeNull()
  })

  it('never chunks a dependency, even one under a components path', () => {
    expect(chunkFor('/repo/node_modules/x/src/components/Button/Button.js', boundaries, read)).toBeNull()
  })

  it('returns null when the module cannot be read', () => {
    expect(chunkFor('src/components/Nope/Nope.tsx', boundaries, read)).toBeNull()
  })

  it('throws on a component under components/ that nobody classified', () => {
    expect(() => chunkFor('src/components/Ghost/Ghost.tsx', boundaries, read)).toThrow(/Ghost.*not classified/s)
  })

  // One module gets one directive or none, so it cannot hold both sides.
  it('throws on a module defining components on both sides of the boundary', () => {
    expect(() => chunkFor('src/components/Mixed/Mixed.tsx', boundaries, read)).toThrow(/BOTH sides/)
  })

  it('does not mistake a Props type for an unclassified component', () => {
    expect(chunkFor('src/components/Button/ButtonProps.ts', boundaries, read)).toBe(SHARED_CHUNK)
  })
})

describe('manualChunks (the callback Rollup actually calls)', () => {
  it('is a function of the module id alone, reading the classification once', async () => {
    const { manualChunks } = await import('../chunk-plan.mjs')
    const place = manualChunks(classification)
    expect(typeof place).toBe('function')
    // Reads from disk by default, so a path that does not exist places nowhere rather than throwing.
    expect(place('/definitely/not/here/src/components/X/X.tsx')).toBeNull()
    expect(place('\0virtual:x')).toBeNull()
  })

  it('reads real files from disk when no reader is injected', async () => {
    const { chunkFor: cf, boundaryMap: bm } = await import('../chunk-plan.mjs')
    const { writeFileSync, mkdirSync } = await import('node:fs')
    const { mkdtempSync } = await import('node:fs')
    const { tmpdir } = await import('node:os')
    const { join } = await import('node:path')
    const dir = join(mkdtempSync(join(tmpdir(), 'cp-')), 'src', 'components', 'Widget')
    mkdirSync(dir, { recursive: true })
    const file = join(dir, 'Widget.tsx')
    writeFileSync(file, 'export function Widget () {}')
    expect(cf(file, bm({ components: [{ name: 'Widget', boundary: 'client' }] }))).toBe(CLIENT_CHUNK)
  })
})

describe('boundaryMap', () => {
  it('tolerates a document with no components', async () => {
    const { boundaryMap: bm } = await import('../chunk-plan.mjs')
    expect(bm({}).size).toBe(0)
    expect(bm(undefined).size).toBe(0)
  })
})

// The predicates below decide placement for every module in the build, and each was pinned by
// nothing: mutating their regexes and string literals survived (review F6). They are small and
// total, so they are tested directly rather than only through chunkFor.
describe('isOwnSource - the exact boundary of "ours"', () => {
  it.each([
    ['a non-string id', 123],
    ['a null id', null],
    ['a rollup virtual module', '\0commonjsHelpers.js'],
    ['a dependency', '/repo/node_modules/react/src/index.js'],
    ['a nested dependency', '/repo/packages/react/node_modules/x/src/a.ts'],
    ['a stylesheet', 'src/styles.css'],
    ['a json file', 'src/data.json'],
    ['a file outside src', 'scripts/thing.ts'],
  ])('rejects %s', (_label, id) => {
    expect(isOwnSource(id as string)).toBe(false)
  })

  it.each(['src/a.ts', 'src/a.tsx', 'src/a.js', 'src/a.jsx', '/abs/pkg/src/deep/a.ts'])(
    'accepts %s', (id) => {
      expect(isOwnSource(id)).toBe(true)
    })
})

describe('placement predicates', () => {
  const only = (name: string, boundary: string) => boundaryMap({ components: [{ name, boundary }] })

  // isEntry: the entry must stay unchunked, and nothing else may be mistaken for it.
  it.each(['src/index.ts', 'src/index.tsx', '/repo/packages/react/src/index.ts'])(
    '%s is the entry and stays unchunked', (id) => {
      expect(chunkFor(id, only('Box', 'server'), () => 'export function Box () {}')).toBeNull()
    })

  it.each(['src/index2.ts', 'src/indexer.ts', 'src/components/index.ts', 'src/sub/index.ts.ts'])(
    '%s is NOT the entry', (id) => {
      expect(chunkFor(id, only('Box', 'server'), () => 'export function Box () {}')).toBe(SERVER_CHUNK)
    })

  // isPartName: a capitalised export that is not a component must not read as "unclassified".
  it.each(['ButtonProps', 'ThemeContext', 'ThemeProvider', 'ButtonRef', 'SizeType', 'FieldOptions'])(
    '%s is a part, not an unclassified component', (name) => {
      expect(() => chunkFor('src/components/X/X.ts', new Map(), () => `export interface ${name} { a: 1 }`))
        .not.toThrow()
    })

  it('a capitalised export that is NOT a part shape still demands classification', () => {
    expect(() => chunkFor('src/components/X/X.ts', new Map(), () => 'export function Xylophone () {}'))
      .toThrow(/not classified/)
  })

  // looksLikeComponentModule: only under src/components does an unclassified export mean a mistake.
  it.each(['src/lib/helpers.ts', 'src/hooks/useThing.ts', '/repo/src/utils/Format.ts'])(
    '%s outside components may export anything and lands in the shared chunk', (id) => {
      expect(chunkFor(id, new Map(), () => 'export function Anything () {}')).toBe(SHARED_CHUNK)
    })

  it.each(['src/components/X/X.ts', '/repo/packages/react/src/components/X/X.ts'])(
    '%s is inside components, so an unclassified export throws', (id) => {
      expect(() => chunkFor(id, new Map(), () => 'export function Anything () {}')).toThrow(/not classified/)
    })

  it('names every unclassified export in the error, not just the first', () => {
    expect(() => chunkFor('src/components/X/X.ts', new Map(), () => 'export function Alpha () {}\nexport function Beta () {}'))
      .toThrow(/Alpha, Beta/)
  })

  it('names both sides in the mixed-boundary error', () => {
    const both = boundaryMap({ components: [{ name: 'A', boundary: 'client' }, { name: 'B', boundary: 'server' }] })
    expect(() => chunkFor('src/components/M/M.ts', both, () => 'export function A () {}\nexport function B () {}'))
      .toThrow(/A:client.*B:server/s)
  })
})
