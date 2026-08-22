import { describe, expect, it } from 'vitest'
// @ts-expect-error - plain .mjs helper, no declarations
import { oklch, oklchToRgb } from '../oklch.mjs'

/**
 * Every colour Clara ships comes out of this file. It is checked against anchors that hold
 * independently of the implementation, and - critically - its CLIPPING behaviour is pinned,
 * because silent clipping is what hid a third of the palette being the wrong colour (review X11).
 */
describe('OKLCH anchors', () => {
  it('L=1 C=0 is white and L=0 C=0 is black, at every hue', () => {
    for (const hue of [0, 75, 150, 235, 275, 359]) {
      expect(oklch(1, 0, hue)).toBe('#ffffff')
      expect(oklch(0, 0, hue)).toBe('#000000')
    }
  })

  it('zero chroma is achromatic - r, g and b are equal', () => {
    for (const L of [0.2, 0.45, 0.66, 0.9]) {
      const [r, g, b] = oklchToRgb(L, 0, 275)
      expect(r).toBe(g)
      expect(g).toBe(b)
    }
  })

  it('lightness is monotonic: a higher L is never a darker colour', () => {
    const lums = [0.2, 0.4, 0.6, 0.8].map((L) => oklchToRgb(L, 0, 0)[0])
    expect(lums).toEqual([...lums].sort((a, b) => a - b))
  })

  it('hue changes which channel dominates', () => {
    const [r1, g1, b1] = oklchToRgb(0.6, 0.12, 25) // red-ish
    expect(r1).toBeGreaterThan(g1)
    expect(r1).toBeGreaterThan(b1)
    const [r2, g2, b2] = oklchToRgb(0.6, 0.12, 150) // green-ish
    expect(g2).toBeGreaterThan(r2)
    const [r3, g3, b3] = oklchToRgb(0.6, 0.12, 275) // blue-ish
    expect(b3).toBeGreaterThan(r3)
    expect(b3).toBeGreaterThan(g3)
  })

  it('always emits a well-formed 6-digit hex', () => {
    for (const L of [0, 0.35, 0.7, 1]) {
      for (const C of [0, 0.1, 0.3]) {
        expect(oklch(L, C, 275)).toMatch(/^#[0-9a-f]{6}$/)
      }
    }
  })
})

describe('gamut clipping is real and must stay visible', () => {
  it('CLIPS an out-of-gamut request rather than erroring - the behaviour that hid a wrong palette', () => {
    // A chroma this high at this lightness is far outside sRGB. The result is a valid hex that is
    // NOT the requested colour. Pinned so nobody assumes the converter is total.
    const [r, g, b] = oklchToRgb(0.5, 0.4, 275)
    expect([r, g, b].some((c) => c === 0 || c === 255)).toBe(true)
  })

  it('the shipped chroma ceiling stays inside the gamut for every Clara hue', () => {
    // These are generate-ramps.mjs's committed values. If a future edit raises them, this fails
    // here rather than silently shipping a clipped colour.
    const L = [1.0, 0.976, 0.955, 0.905, 0.845, 0.76, 0.66, 0.56, 0.455, 0.345, 0.235]
    const C = [0, 0.01, 0.02, 0.045, 0.075, 0.12, 0.135, 0.115, 0.095, 0.07, 0.045]
    for (const hue of [25, 75, 150, 235, 275]) {
      L.forEach((l, i) => {
        const [r, g, b] = oklchToRgb(l, C[i], hue)
        const railed = [r, g, b].some((c) => c === 0 || c === 255)
        expect(railed && C[i] > 0, `hue ${hue} step ${i} (L=${l} C=${C[i]}) clipped`).toBe(false)
      })
    }
  })
})
