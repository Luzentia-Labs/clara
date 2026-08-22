import { describe, it, expect } from 'vitest'
// @ts-expect-error - .mjs sibling
import { moduleExports, componentsIn } from '../module-exports.mjs'

/**
 * The reader that replaced a regex which could not see `export default X`. Every case below is a
 * shape that either defeated the regex or must NOT be treated as a component.
 */
describe('componentsIn', () => {
  it.each([
    ['a default-exported arrow const', 'const Switch = (p) => null\nexport default Switch', ['Switch']],
    ['a default-exported function declaration', 'export default function Panel () {}', ['Panel']],
    ['an anonymous default arrow', 'export default () => null', ['default']],
    ['a named function export', 'export function Button () {}', ['Button']],
    ['a class component', 'export class Grid {}', ['Grid']],
    ['an arrow const', 'export const Box = () => null', ['Box']],
    ['a forwardRef call', 'export const Field = forwardRef((p, r) => null)', ['Field']],
    ['a memo call', 'export const Row = memo(function Row () {})', ['Row']],
    ['a Provider, which a suffix heuristic used to exclude', 'export function ThemeProvider () {}', ['ThemeProvider']],
    ['a default-exported forwardRef', 'const Input = forwardRef((p, r) => null)\nexport default Input', ['Input']],
    ['a local binding exported later', 'function Stack () {}\nexport { Stack }', ['Stack']],
    ['a renamed local export', 'function S () {}\nexport { S as Stack }', ['Stack']],
  ])('finds %s', (_label, src, expected) => {
    expect([...componentsIn(src)]).toEqual(expected)
  })

  it.each([
    ['a plain constant', "export const BUTTON_VARIANTS = ['primary']"],
    ['an interface', 'export interface ButtonProps { a: string }'],
    ['a type alias', 'export type Size = "sm" | "lg"'],
    ['a lowercase helper', 'export const cx = () => 1'],
    ['a hook', 'export function useTheme () {}'],
    ['a re-export', "export { Box } from './Box'"],
    ['a line-broken re-export', "export { Box }\nfrom './Box'"],
    ['a star re-export', "export * from './all'"],
    ['a type-only re-export', "export type { BoxProps } from './Box'"],
    ['a non-exported component', 'function Private () {}'],
    ['a number constant', 'export const MAX = 10'],
    ['an object constant', 'export const CONFIG = { a: 1 }'],
  ])('does not treat %s as a component', (_label, src) => {
    expect([...componentsIn(src)]).toEqual([])
  })

  it('reads TSX with generics and JSX without tripping', () => {
    const src = 'export function List<T> ({ items }: { items: T[] }) { return <ul>{items.length}</ul> }'
    expect([...componentsIn(src, 'List.tsx')]).toEqual(['List'])
  })

  it('finds several components in one module', () => {
    expect([...componentsIn('export function A () {}\nexport const B = () => null')]).toEqual(['A', 'B'])
  })

  it('ignores a type-only named export', () => {
    expect([...componentsIn('const X = () => null\nexport { type X }')]).toEqual([])
  })
})

describe('moduleExports', () => {
  it('reports whether each export is function-like, which is what identifies a component', () => {
    const out = moduleExports("export const A = () => null\nexport const B = 1")
    expect(out).toEqual([{ name: 'A', functionLike: true }, { name: 'B', functionLike: false }])
  })

  it('sees through a parenthesised or asserted initializer', () => {
    expect(moduleExports('export const A = (() => null)')[0].functionLike).toBe(true)
    expect(moduleExports('export const A = (() => null) as never')[0].functionLike).toBe(true)
  })

  it('does not double-count a name', () => {
    expect(moduleExports('export function A () {}\nexport { A }')).toHaveLength(1)
  })

  it('returns nothing for an empty module', () => {
    expect(moduleExports('')).toEqual([])
  })
})
