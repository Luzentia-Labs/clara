import { describe, it, expect } from 'vitest'
// @ts-expect-error - .mjs sibling
import { componentOf, chunkFor, boundaryMap, CLIENT_CHUNK, SERVER_CHUNK } from '../chunk-plan.mjs'

const classification = {
  components: [
    { name: 'Button', boundary: 'client', status: 'built' },
    { name: 'Box', boundary: 'server', status: 'built' },
    { name: 'Dialog', boundary: 'client', status: 'planned' },
  ],
}

describe('componentOf', () => {
  it.each([
    ['/repo/packages/react/src/components/Button/Button.tsx', 'Button'],
    ['/repo/packages/react/src/components/Button/useButton.ts', 'Button'],
    ['packages/react/src/components/Box/index.ts', 'Box'],
    ['src/components/Dialog/parts/Header.tsx', 'Dialog'],
  ])('reads the component name from %s', (id, expected) => {
    expect(componentOf(id)).toBe(expected)
  })

  it.each([
    'src/index.ts',
    'src/styles.css',
    'src/utils/cx.ts',
    '\0virtual:something',
    '/repo/node_modules/react/index.js',
  ])('returns null for %s, which belongs to no component', (id) => {
    expect(componentOf(id)).toBeNull()
  })

  // Windows separators: the build runs on whatever CI gives us.
  it('handles backslash separators', () => {
    expect(componentOf('packages\\react\\src\\components\\Button\\Button.tsx')).toBe('Button')
  })
})

describe('boundaryMap', () => {
  it('maps every classified component to its boundary', () => {
    const m = boundaryMap(classification)
    expect(m.get('Button')).toBe('client')
    expect(m.get('Box')).toBe('server')
  })
})

describe('chunkFor', () => {
  const boundaries = boundaryMap(classification)

  it('cuts a client component into the client chunk', () => {
    expect(chunkFor('src/components/Button/Button.tsx', boundaries)).toBe(CLIENT_CHUNK)
  })

  it('cuts a server component into the server chunk', () => {
    expect(chunkFor('src/components/Box/Box.tsx', boundaries)).toBe(SERVER_CHUNK)
  })

  // The entry must stay unchunked and therefore undirectived: it is what keeps the package
  // server-capable, so the boundary forms where a consumer imports a client component.
  it('leaves the entry and shared utilities unchunked', () => {
    expect(chunkFor('src/index.ts', boundaries)).toBeNull()
    expect(chunkFor('src/utils/cx.ts', boundaries)).toBeNull()
  })

  // A component nobody classified must not silently land in a chunk. The build fails instead -
  // this is the same rule check-client-boundary enforces on the exports, moved earlier.
  it('throws on a component that is in the tree but not in the classification', () => {
    expect(() => chunkFor('src/components/Ghost/Ghost.tsx', boundaries))
      .toThrow(/Ghost.*classif/i)
  })

  it('never chunks a dependency, even one under a components path', () => {
    expect(chunkFor('/repo/node_modules/x/src/components/Button/Button.js', boundaries)).toBeNull()
  })
})
