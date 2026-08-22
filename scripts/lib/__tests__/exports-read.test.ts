import { describe, it, expect } from 'vitest'
// @ts-expect-error - .mjs sibling
import { exportedNames, definedNames } from '../exports-read.mjs'

describe('exportedNames', () => {
  // The shape that defeated the first reader: `^export` under /m needs a line start, and this
  // build minifies, so this is what the real bundle looks like once components exist.
  it('reads a minified single-line bundle', () => {
    expect([...exportedNames('const Button=()=>null;const Card=()=>null;export{Button,Card};')])
      .toEqual(['Button', 'Card'])
  })

  it('takes the exported name from a rename, not the local one', () => {
    expect([...exportedNames('export {\n  Rogue as Button_Unstyled\n};')]).toEqual(['Button_Unstyled'])
  })

  // The second defeat: names with _ or $ were dropped rather than reported.
  it.each(['Button_Unstyled', 'Button$', '_Private'])('does not silently drop %s', (name) => {
    const found = exportedNames(`export { ${name} }`)
    expect(found.size + (/^[A-Z]/.test(name) ? 0 : 1)).toBeGreaterThan(0)
  })

  it.each([
    ['export const', 'export const Box = () => null', 'Box'],
    ['export function', 'export function Stack() {}', 'Stack'],
    ['export class', 'export class Grid {}', 'Grid'],
    ['cjs', 'exports.Divider = Divider;', 'Divider'],
  ])('reads %s', (_l, src, expected) => {
    expect([...exportedNames(src)]).toContain(expected)
  })

  it('excludes hooks and default, which are not components', () => {
    expect([...exportedNames('export { useTheme, Grid };\nexport default Grid;')]).toEqual(['Grid'])
  })

  it('returns nothing for a bundle with no exports', () => {
    expect(exportedNames('const x = 1\n').size).toBe(0)
  })

  it('handles quoted export names', () => {
    expect([...exportedNames('export { Foo as "Bar" }')]).toContain('Bar')
  })
})

describe('definedNames', () => {
  // The distinction that makes the placement check work: src/index.ts re-exports every component,
  // so counting re-exports would place every component in the entry chunk.
  it('ignores a re-export, which forwards rather than defines', () => {
    expect(definedNames("export { Box } from './components/Box/Box'").size).toBe(0)
  })

  it.each([
    ['export function Button () {}', 'Button'],
    ['export const Box = () => null', 'Box'],
    ['export class Grid {}', 'Grid'],
  ])('counts the definition in %s', (src, expected) => {
    expect([...definedNames(src)]).toEqual([expected])
  })

  it('counts a local binding exported without a from clause', () => {
    expect([...definedNames('function Stack () {}\nexport { Stack }')]).toEqual(['Stack'])
  })

  it('excludes hooks and lowercase helpers', () => {
    expect([...definedNames('export function useThing () {}\nexport const cx = () => 1')]).toEqual([])
  })
})

describe('exportedNames - shapes a real bundle emits', () => {
  it.each([
    ['export * from "./x"', 0],
    ['export { default as Thing } from "./t"', 1],
    ['exports.A = A; exports.B = B;', 2],
  ])('handles %s', (src, expected) => {
    expect(exportedNames(src).size).toBe(expected)
  })

  it('reads names across a multi-line export block', () => {
    expect([...exportedNames('export {\n  Alpha,\n  Beta as Gamma\n};')]).toEqual(['Alpha', 'Gamma'])
  })
})

describe('definedNames - shapes that must not count', () => {
  it.each([
    'export { Box } from "./b"',
    'export * from "./b"',
    'export type { BoxProps } from "./b"',
  ])('%s defines nothing here', (src) => {
    expect(definedNames(src).size).toBe(0)
  })

  it('counts an exported default function by name', () => {
    expect([...definedNames('export default function Panel () {}')]).toEqual(['Panel'])
  })
})
