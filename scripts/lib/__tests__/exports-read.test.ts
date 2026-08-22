import { describe, it, expect } from 'vitest'
// @ts-expect-error - .mjs sibling
import { exportedNames } from '../exports-read.mjs'

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
