import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
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
 * The order is asserted as an ORDER rather than as literal values. Literals would catch a
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
    // ClaraPortal appends each host to document.body at the moment it opens, so later opens are
    // later siblings.
    //
    // Asserted as an ALLOWLIST, not as a denied word list. The first version denied seven role
    // names, which let `layer.sheet` or `layer.command-palette` re-introduce the very constant this
    // criterion exists to prevent with all eight tests green. The set of public layer names is
    // closed by D0088, so the exhaustive form is both shorter and the one that cannot go stale.
    expect(Object.keys(semantic.layer).sort()).toEqual([...NAMES].sort())
  })

  it('leaves room above the overlay layer for the two that must always win', () => {
    expect(layer('tooltip') - layer('overlay')).toBeGreaterThanOrEqual(100)
    // No gap between tooltip and toast: they are ONE layer on purpose (D0102), so the headroom
    // assertion that used to sit here would now be asserting the defect.
    expect(layer('toast')).toBe(layer('tooltip'))
  })

  it('starts at zero, so the scale is measured from the page rather than floating above it', () => {
    expect(layer('base')).toBe(0)
  })

  it('is NOT overridden per theme or per density', () => {
    // Stacking order is not a themed property, and an override would be invisible to every other
    // assertion here: a `layer.overlay` in compact.json changes the stacking at one density only,
    // with the whole suite and every guard green. Found by a review, not by a gate.
    // Read the directory rather than list the files. The hardcoded list named `light.json`, which
    // does not exist, so a third of this loop was a no-op - and any theme file added later would
    // have been unguarded by default, which is the wrong direction for a check like this.
    const themes = readdirSync(join(pkg, 'src/themes')).filter((f) => f.endsWith('.json'))
    expect(themes.length, 'no theme files found - this assertion checked nothing').toBeGreaterThan(0)
    for (const file of themes) {
      const overrides = JSON.parse(readFileSync(join(pkg, 'src/themes', file), 'utf8'))
      expect(Object.keys(overrides.layer ?? {}), `${file} overrides the layer scale`).toHaveLength(0)
    }
  })
})

describe('the overlay layer scale is documented', () => {
  it('matches the table consumers are told to read', () => {
    // The docs table carries the NUMBERS, because an application has to keep its own chrome below
    // `overlay` and cannot do that against a name alone. A table nothing checks drifts: retargeting
    // `layer.3` in the source left the documented 1400 in place with every gate green.
    const docs = join(__dirname, '../../../../apps/docs/src/content/foundations/tokens.md')
    const table = readFileSync(docs, 'utf8')
    const documented = new Map(
      [...table.matchAll(/^\|\s*`--clara-layer-([\w-]+)`\s*\|\s*(\d+)\s*\|/gm)].map((m) => [m[1], Number(m[2])]),
    )
    expect([...documented.keys()].sort(), 'the docs table lists a different set of layers').toEqual([...NAMES].sort())
    for (const [name, value] of documented) {
      expect(value, `the docs say --clara-layer-${name} is ${value}`).toBe(layer(name))
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

  it('gives a tooltip and a toast ONE layer, so arrival order decides between them', () => {
    // The two comments used to contradict each other, and the collision was real: a Toast action
    // (Retry, Undo) may carry a tooltip, which then describes the thing on top while rendering
    // UNDER it - the one case where a tooltip is useless. But the reverse is equally required: a
    // toast arriving over an already-open tooltip must win, because it is the new information.
    //
    // Same pair, both directions, decided by which happened last. A constant expresses a
    // stacking relationship correctly only when that relationship is UNIDIRECTIONAL (D0102), so
    // this pair gets open order - the mechanism D0088 and D0089 already built.
    expect(layer('toast')).toBe(layer('tooltip'))
    // Both still clear the overlay family, which IS one-directional.
    for (const under of ['base', 'raised', 'overlay']) {
      expect(layer('toast')).toBeGreaterThan(layer(under))
    }
  })

  it('leaves no unreferenced step in the primitive scale', () => {
    // `layer.4` was 1500 and became unreferenced when toast moved down. An orphan step is a loaded
    // gun: it invites the next agent to "fix" the duplicate value by pointing one token at it,
    // which would silently restore the per-role constant this decision removed.
    const referenced = new Set(Object.values(semantic.layer).map((t) => t.value.replace(/[{}]/g, '').split('.')[1]))
    expect(Object.keys(primitives.layer).sort()).toEqual([...referenced].sort())
  })
})
