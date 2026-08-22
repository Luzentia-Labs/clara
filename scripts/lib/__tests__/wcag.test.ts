import { describe, expect, it } from 'vitest'
// @ts-expect-error - plain .mjs helper, no declarations
import { contrastRatio, parseHex, relativeLuminance } from '../wcag.mjs'

/**
 * Every accessibility claim Clara makes rests on this file, so it is checked against PUBLISHED
 * reference values rather than against itself. A test that only asserts self-consistency would
 * have passed on a wrong implementation.
 */
describe('relativeLuminance', () => {
  it('is exactly 1 for white and 0 for black, per the WCAG definition', () => {
    expect(relativeLuminance([255, 255, 255])).toBe(1)
    expect(relativeLuminance([0, 0, 0])).toBe(0)
  })

  it('weights green most and blue least (0.2126 / 0.7152 / 0.0722)', () => {
    const r = relativeLuminance([255, 0, 0])
    const g = relativeLuminance([0, 255, 0])
    const b = relativeLuminance([0, 0, 255])
    expect(g).toBeGreaterThan(r)
    expect(r).toBeGreaterThan(b)
    expect(r).toBeCloseTo(0.2126, 4)
    expect(g).toBeCloseTo(0.7152, 4)
    expect(b).toBeCloseTo(0.0722, 4)
  })
})

describe('contrastRatio against published references', () => {
  // Black on white is the definitional maximum.
  it('black on white is 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 4)
  })

  it('a colour against itself is 1:1', () => {
    expect(contrastRatio('#7b8ae4', '#7b8ae4')).toBeCloseTo(1, 10)
  })

  // #767676 on white is the canonical AA boundary case - the lightest grey that passes 4.5:1.
  it('#767676 on white clears 4.5:1 and #777777 does not', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio('#777777', '#ffffff')).toBeLessThan(4.5)
  })

  it('is order-independent', () => {
    expect(contrastRatio('#0f7eae', '#ffffff')).toBe(contrastRatio('#ffffff', '#0f7eae'))
  })
})

describe('parseHex refuses what it cannot represent, rather than guessing', () => {
  it('accepts #rgb, #rrggbb, and a bare form', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255])
    expect(parseHex('#ffffff')).toEqual([255, 255, 255])
    expect(parseHex('ffffff')).toEqual([255, 255, 255])
    expect(parseHex('  #FFF  ')).toEqual([255, 255, 255])
  })

  it.each([
    ['4-digit alpha', '#ffff'],
    ['8-digit alpha', '#ffffffff'],
    ['5 digits', '#fffff'],
    ['rgb()', 'rgb(255,255,255)'],
    ['a named colour', 'white'],
    ['not a string', 12345],
    ['empty', ''],
  ])('rejects %s', (_label, input) => {
    expect(parseHex(input as never)).toBeNull()
  })

  it('propagates null through contrastRatio rather than computing a wrong number', () => {
    expect(contrastRatio('not-a-colour', '#ffffff')).toBeNull()
    expect(contrastRatio('#ffffff', 'rgba(0,0,0,0.5)')).toBeNull()
  })
})
