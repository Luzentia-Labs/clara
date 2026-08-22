import { describe, it, expect } from 'vitest'
import { cx } from '../cx'

// Shared by a client and a server component, which is why it lives in the shared chunk (D0047).
describe('cx', () => {
  it('joins the truthy parts with a single space', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c')
  })

  it.each([
    [['a', false, 'b'], 'a b'],
    [['a', undefined, 'b'], 'a b'],
    [[], ''],
    [[false, undefined], ''],
  ])('drops falsy parts: %j -> %j', (parts, expected) => {
    expect(cx(...(parts as Array<string | false | undefined>))).toBe(expected)
  })
})
