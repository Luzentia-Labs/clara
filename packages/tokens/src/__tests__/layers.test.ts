import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The stacking order, read from the token SOURCE rather than the built stylesheet.
 *
 * The first version of this file read `dist/tokens.css`, which is gitignored and produced only by
 * `pnpm build` - and the AC verifier is a bare `vitest run -t` with no build step. So swapping
 * `modal` and `popover` in the source left both criteria GREEN until somebody rebuilt, which meant
 * `reconcile --verify` could stamp them against a source it had never read. `density.test.ts` next
 * door already reads the source and resolves references itself; this now follows it (D0065 - the
 * property, not a proxy for it).
 *
 * The order is asserted as an ORDER rather than as eight literal values. Literals would catch a
 * swap too - the earlier claim that they would not was simply wrong - but they pin numbers that a
 * legitimate renumbering should be free to change, while every pair below states an intent a reader
 * can check against the reasoning.
 */
const pkg = join(__dirname, '../..')
const primitives = JSON.parse(readFileSync(join(pkg, 'src/primitive/base.json'), 'utf8'))
const semantic = JSON.parse(readFileSync(join(pkg, 'src/semantic/geometry.json'), 'utf8'))

const NAMES = ['base', 'raised', 'dropdown', 'scrim', 'modal', 'popover', 'tooltip', 'toast'] as const

/** Resolve a `{layer.4}` reference to its number, through tier 1 as the tier rules require. */
const layer = (name: string): number => {
  const entry = semantic.layer?.[name]
  expect(entry, `--clara-layer-${name} is not declared in the semantic layer`).toBeDefined()
  const ref = /^\{layer\.(\d+)\}$/.exec(String(entry.value))
  expect(ref, `layer.${name} = "${entry.value}" must reference a tier 1 step, not carry a raw value`).not.toBeNull()
  const step = primitives.layer?.[ref![1]]
  expect(step, `tier 1 step layer.${ref![1]} is not declared`).toBeDefined()
  return Number(step.value)
}

describe('the overlay layer scale is tokenised', () => {
  it('declares every layer the components will need', () => {
    for (const name of NAMES) expect(Number.isFinite(layer(name))).toBe(true)
  })

  it('leaves room between layers for a component to sit between two of them', () => {
    // Adjacent steps 1 apart would force the next overlay to renumber the scale. The gap is the
    // affordance: `calc(var(--clara-layer-modal) + 1)` without a token change.
    const ordered = ['dropdown', 'scrim', 'modal', 'popover', 'tooltip', 'toast'].map(layer)
    for (const [i, value] of ordered.slice(1).entries()) {
      expect(value - ordered[i]!).toBeGreaterThanOrEqual(100)
    }
  })

  it('starts at zero, so the scale is measured from the page rather than floating above it', () => {
    expect(layer('base')).toBe(0)
  })

  it('is NOT overridden per theme or per density', () => {
    // Stacking order is not a themed property, and an override would be invisible to every other
    // assertion here: a `layer.popover` in compact.json puts a Select behind a Modal at compact
    // density with the whole suite and every guard green. Found by a review, not by a gate.
    for (const file of ['compact.json', 'dark.json', 'light.json']) {
      const path = join(pkg, 'src/themes', file)
      if (!existsSync(path)) continue
      const overrides = JSON.parse(readFileSync(path, 'utf8'))
      expect(Object.keys(overrides.layer ?? {}), `${file} overrides the layer scale`).toHaveLength(0)
    }
  })
})

describe('the overlay stacking order', () => {
  it('puts a modal above its own scrim, and the scrim above any open dropdown', () => {
    // Opening a Modal must cover a menu that was already open, or the menu floats over the scrim
    // and looks interactive while the modal holds the focus.
    expect(layer('modal')).toBeGreaterThan(layer('scrim'))
    expect(layer('scrim')).toBeGreaterThan(layer('dropdown'))
  })

  it('puts a popover ABOVE a modal, which is the whole reason the scale is ordered this way', () => {
    // A Select opened from INSIDE a Modal is the case that breaks naive scales: its listbox has to
    // clear the modal surface it was opened from, or the user picks from a list they cannot see.
    expect(layer('popover')).toBeGreaterThan(layer('modal'))
  })

  it('puts a tooltip above everything it might describe', () => {
    for (const under of ['base', 'raised', 'dropdown', 'scrim', 'modal', 'popover']) {
      expect(layer('tooltip')).toBeGreaterThan(layer(under))
    }
  })

  it('puts toasts at the top, because a toast may be the only report that something failed', () => {
    for (const under of ['base', 'raised', 'dropdown', 'scrim', 'modal', 'popover', 'tooltip']) {
      expect(layer('toast')).toBeGreaterThan(layer(under))
    }
  })

  it('orders the in-document layers from the page upward', () => {
    expect(layer('raised')).toBeGreaterThan(layer('base'))
    expect(layer('dropdown')).toBeGreaterThan(layer('raised'))
  })
})
