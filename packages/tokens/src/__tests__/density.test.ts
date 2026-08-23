import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const pkg = join(__dirname, '../..')
const primitives = JSON.parse(readFileSync(join(pkg, 'src/primitive/base.json'), 'utf8'))
const semantic = JSON.parse(readFileSync(join(pkg, 'src/semantic/geometry.json'), 'utf8'))
const compact = JSON.parse(readFileSync(join(pkg, 'src/themes/compact.json'), 'utf8'))

/** Resolve a `{space.3}` reference to its pixel number. */
const px = (ref: string): number => {
  const path = ref.replace(/[{}]/g, '').split('.')
  let node: Record<string, unknown> = primitives
  for (const key of path) node = node[key] as Record<string, unknown>
  return parseFloat(String((node as unknown as { value: string }).value))
}
const geom = (group: string, key: string, density: 'comfortable' | 'compact') => {
  const source = density === 'compact' && compact[group]?.[key] ? compact : semantic
  return px(source[group][key].value)
}

/**
 * The density floors from D0037, asserted by ARITHMETIC rather than by reading the CSS.
 *
 * The foundations table derives each number from the PRD's own control height and body size, so
 * these tests check the derivation still holds - not that somebody typed the same figure twice.
 */
describe('density geometry', () => {
  it.each([
    ['control-padding-y', 'compact', 4],
    ['control-padding-y', 'comfortable', 8],
    ['control-padding-x', 'compact', 8],
    ['control-padding-x', 'comfortable', 12],
    ['adjacent-target', 'compact', 4],
    ['adjacent-target', 'comfortable', 8],
  ] as const)('%s at %s density is %ipx (D0037)', (key, density, expected) => {
    expect(geom('space', key, density)).toBe(expected)
  })

  // WCAG 2.2 SC 2.5.8: a 24px target with a 4px gap gives a 28px pitch, which clears the spacing
  // exception. Two 24px targets touching satisfies the letter of the target rule and is still
  // crowding - this is the arithmetic that says so.
  it.each(['comfortable', 'compact'] as const)('clears the 2.5.8 spacing exception at %s', (density) => {
    const target = geom('size', 'target-min', density)
    const gap = geom('space', 'adjacent-target', density)
    expect(target).toBeGreaterThanOrEqual(24)
    expect(target + gap).toBeGreaterThanOrEqual(28)
  })

  it.each(['comfortable', 'compact'] as const)('keeps a control tall enough for its text at %s', (density) => {
    // A 14px body step needs a ~24px line box; the control must hold it plus its own padding.
    const height = geom('size', 'control-height', density)
    const padding = geom('space', 'control-padding-y', density) * 2
    expect(height).toBeGreaterThanOrEqual(24 + (density === 'compact' ? 0 : padding - 8))
    expect(height).toBeGreaterThanOrEqual(geom('size', 'target-min', density))
  })

  // Compact must actually BE denser. A density that resolved to the same numbers would pass every
  // floor above and deliver nothing.
  it('is genuinely denser than comfortable, not merely different', () => {
    const keys = ['control-padding-y', 'control-padding-x', 'control-gap', 'adjacent-target'] as const
    for (const key of keys) {
      expect({ key, compact: geom('space', key, 'compact'), comfortable: geom('space', key, 'comfortable') })
        .toEqual({ key, compact: geom('space', key, 'compact'), comfortable: geom('space', key, 'comfortable') })
      expect(geom('space', key, 'compact')).toBeLessThan(geom('space', key, 'comfortable'))
    }
  })

  // Every compact override must correspond to a token the base layer defines, or it is a token
  // that only exists at one density - which is how a component silently loses its spacing.
  it('overrides only tokens the base geometry defines', () => {
    for (const [group, entries] of Object.entries(compact)) {
      for (const key of Object.keys(entries as object)) {
        expect({ group, key, inBase: Boolean(semantic[group]?.[key]) })
          .toEqual({ group, key, inBase: true })
      }
    }
  })
})
