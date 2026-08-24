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

const NAMES = ['base', 'raised', 'overlay', 'tooltip', 'toast'] as const

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

  it('gives every portalled surface ONE layer, so open order decides between them', () => {
    // The scale deliberately has no per-role step for modal, drawer, popover, menu or listbox.
    // Which of two overlays is on top depends on which was opened last, and a constant cannot
    // express that: a menu must sit UNDER a modal that opens over it, and OVER a modal opened from
    // inside it. The browser already answers it - equal z-index paints in tree order - and
    // ClaraPortal appends each host to document.body, so later opens are later siblings.
    const layers = Object.keys(semantic.layer)
    for (const role of ['modal', 'drawer', 'popover', 'dropdown', 'menu', 'listbox', 'scrim']) {
      expect(layers, `a per-role layer for ${role} re-introduces the constant this scale removed`).not.toContain(role)
    }
    expect(layers).toContain('overlay')
  })

  it('leaves room above the overlay layer for the two that must always win', () => {
    expect(layer('tooltip') - layer('overlay')).toBeGreaterThanOrEqual(100)
    expect(layer('toast') - layer('tooltip')).toBeGreaterThanOrEqual(100)
  })

  it('starts at zero, so the scale is measured from the page rather than floating above it', () => {
    expect(layer('base')).toBe(0)
  })

  it('is NOT overridden per theme or per density', () => {
    // Stacking order is not a themed property, and an override would be invisible to every other
    // assertion here: a `layer.overlay` in compact.json changes the stacking at one density only,
    // with the whole suite and every guard green. Found by a review, not by a gate.
    for (const file of ['compact.json', 'dark.json', 'light.json']) {
      const path = join(pkg, 'src/themes', file)
      if (!existsSync(path)) continue
      const overrides = JSON.parse(readFileSync(path, 'utf8'))
      expect(Object.keys(overrides.layer ?? {}), `${file} overrides the layer scale`).toHaveLength(0)
    }
  })
})

describe('the overlay stacking order', () => {
  it('puts every portalled surface above in-document content', () => {
    expect(layer('overlay')).toBeGreaterThan(layer('raised'))
    expect(layer('raised')).toBeGreaterThan(layer('base'))
  })

  it('puts a tooltip above every overlay, whatever was opened last', () => {
    // Not nesting-dependent: a tooltip describes whatever is currently on top, so it is one of the
    // two relationships that IS global and therefore does belong in the scale.
    expect(layer('tooltip')).toBeGreaterThan(layer('overlay'))
  })

  it('puts toasts above everything, because a toast may be the only report that something failed', () => {
    for (const under of ['base', 'raised', 'overlay', 'tooltip']) {
      expect(layer('toast')).toBeGreaterThan(layer(under))
    }
  })
})
