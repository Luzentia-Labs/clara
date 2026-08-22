import { describe, it, expect } from 'vitest'
// @ts-expect-error - .mjs sibling, checked by the guard rather than by types
import { inspectTarball, exportTargets } from '../pack-inspect.mjs'

const listing = ['package/package.json', 'package/dist/index.js', 'package/dist/index.cjs']

describe('inspectTarball', () => {
  it('passes a tarball a consumer can actually install', () => {
    expect(inspectTarball('p', { dependencies: { dep: '^1.0.0' } }, listing)).toEqual([])
  })

  // The one that motivated the guard: npm pack leaves this verbatim, pnpm rewrites it, and a
  // published workspace: range breaks every install permanently.
  it('rejects a workspace protocol that survived into the tarball', () => {
    const errors = inspectTarball('p', { dependencies: { a: 'workspace:*' } }, listing)
    expect(errors[0]).toContain('ships dependencies.a = "workspace:*"')
    expect(errors[1]).toContain('EUNSUPPORTEDPROTOCOL')
  })

  it.each(['peerDependencies', 'optionalDependencies'])('checks %s too', (field) => {
    expect(inspectTarball('p', { [field]: { a: 'workspace:^' } }, listing)).not.toEqual([])
  })

  it.each(['link:../x', 'file:../x'])('rejects the local path %s', (range) => {
    const errors = inspectTarball('p', { dependencies: { a: range } }, listing)
    expect(errors[1]).toContain('local path')
  })

  it('does not confuse a version that merely contains the word', () => {
    expect(inspectTarball('p', { dependencies: { a: '1.0.0-workspace:x' } }, listing)).toEqual([])
  })

  it('catches an exports target the tarball does not ship', () => {
    const errors = inspectTarball('p', { exports: { '.': './dist/missing.js' } }, listing)
    expect(errors[0]).toContain('the tarball has no dist/missing.js')
  })

  it('reaches targets nested under export conditions', () => {
    const exports = { '.': { import: { types: './dist/nope.d.ts', default: './dist/index.js' } } }
    const errors = inspectTarball('p', { exports }, listing)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('dist/nope.d.ts')
  })

  it('ignores package.json, which is always present', () => {
    expect(inspectTarball('p', { exports: { './package.json': './package.json' } }, listing)).toEqual([])
  })
})

describe('exportTargets', () => {
  it('flattens every string leaf and tolerates an absent map', () => {
    expect(exportTargets({ '.': { a: './x.js', b: { c: './y.js' } } })).toEqual(['./x.js', './y.js'])
    expect(exportTargets(undefined)).toEqual([])
  })
})

describe('internal dependency ranges (D0049)', () => {
  it('accepts a caret on an internal dependency', () => {
    expect(inspectTarball('p', { dependencies: { '@luzentialabs/clara-tokens': '^1.2.0' } }, listing)).toEqual([])
  })

  // workspace:* rewrites to an exact version, so a consumer on a later patch installs both copies.
  it('rejects an exact pin on an internal dependency', () => {
    const errors = inspectTarball('p', { dependencies: { '@luzentialabs/clara-tokens': '1.2.0' } }, listing)
    expect(errors[0]).toContain('an exact pin')
    expect(errors[1]).toContain('dedupe')
  })

  it('leaves third-party ranges alone - pinning those is the consumer\'s business', () => {
    expect(inspectTarball('p', { dependencies: { 'some-lib': '1.2.0' } }, listing)).toEqual([])
  })

  it.each(['~1.2.0', '>=1.0.0 <2.0.0', '1.x'])('does not flag the non-exact range %s', (range) => {
    const errors = inspectTarball('p', { dependencies: { '@luzentialabs/clara-tokens': range } }, listing)
    expect(errors.filter((e) => e.includes('exact pin'))).toEqual([])
  })
})
