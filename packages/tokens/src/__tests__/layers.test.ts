import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The stacking order, asserted as an ORDER rather than as eight numbers.
 *
 * Asserting each token's literal value would pass on any set of numbers, including one that puts a
 * tooltip under a modal - it would only prove that somebody typed what they typed. What matters is
 * the relative order, and every pair below is a real decision that a reader should be able to
 * check against the reasoning rather than against a magic number.
 */
const css = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../dist/tokens.css'),
  'utf8',
)

/** The resolved numeric value of a semantic layer token, following its tier 1 reference. */
const layer = (name: string): number => {
  const semantic = new RegExp(`--clara-layer-${name}:\\s*var\\(--clara-layer-(\\d+)\\)`).exec(css)
  expect(semantic, `--clara-layer-${name} is not declared, or does not reference a tier 1 step`).not.toBeNull()
  const primitive = new RegExp(`--clara-layer-${semantic![1]}:\\s*(\\d+)`).exec(css)
  expect(primitive, `tier 1 step --clara-layer-${semantic![1]} is not declared`).not.toBeNull()
  return Number(primitive![1])
}

describe('the overlay layer scale is tokenised', () => {
  it('declares every layer the components will need', () => {
    for (const name of ['base', 'raised', 'dropdown', 'overlay', 'modal', 'popover', 'tooltip', 'toast']) {
      expect(Number.isFinite(layer(name))).toBe(true)
    }
  })

  it('leaves room between layers for a component to sit between two of them', () => {
    // Adjacent steps 1 apart would force the next overlay to renumber the scale. The gap is the
    // affordance: a component can take `calc(var(--clara-layer-modal) + 1)` without a token change.
    const ordered = ['dropdown', 'overlay', 'modal', 'popover', 'tooltip', 'toast'].map(layer)
    for (const [i, value] of ordered.slice(1).entries()) {
      expect(value - ordered[i]!).toBeGreaterThanOrEqual(100)
    }
  })

  it('starts at zero, so the scale is measured from the page rather than floating above it', () => {
    expect(layer('base')).toBe(0)
  })
})

describe('the overlay stacking order', () => {
  it('puts a modal above its own scrim, and the scrim above any open dropdown', () => {
    // Opening a Modal must cover a menu that was already open, or the menu floats over the scrim
    // and looks interactive while the modal has taken the focus.
    expect(layer('modal')).toBeGreaterThan(layer('overlay'))
    expect(layer('overlay')).toBeGreaterThan(layer('dropdown'))
  })

  it('puts a popover ABOVE a modal, which is the whole reason the scale is ordered this way', () => {
    // A Select opened from INSIDE a Modal is the case that breaks naive scales: its listbox has to
    // clear the modal surface it was opened from, or the user picks from a list they cannot see.
    expect(layer('popover')).toBeGreaterThan(layer('modal'))
  })

  it('puts a tooltip above everything it might describe', () => {
    for (const under of ['base', 'raised', 'dropdown', 'overlay', 'modal', 'popover']) {
      expect(layer('tooltip')).toBeGreaterThan(layer(under))
    }
  })

  it('puts toasts at the top, because a toast may be the only report that something failed', () => {
    for (const under of ['base', 'raised', 'dropdown', 'overlay', 'modal', 'popover', 'tooltip']) {
      expect(layer('toast')).toBeGreaterThan(layer(under))
    }
  })

  it('orders the in-document layers from the page upward', () => {
    expect(layer('raised')).toBeGreaterThan(layer('base'))
    expect(layer('dropdown')).toBeGreaterThan(layer('raised'))
  })
})
