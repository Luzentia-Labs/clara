import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
// @ts-expect-error - plain .mjs helper
import { LAYER_DECLARATION, LAYER_NAMES, applyCascadeLayer } from '../scripts/lib/cascade-layer.mjs'

/**
 * The override guarantee (D0005): a consumer's UNLAYERED class beats every Clara layer without
 * `!important`. That is a property of the cascade, so it is asserted against the real emitted
 * stylesheet rather than a fixture.
 */
describe('cascade layer contract', () => {
  const sheets = [
    'packages/react/dist/styles.css',
    'packages/tokens/dist/tokens.css',
    'packages/tokens/dist/themes/dark.css',
  ]

  it.each(sheets)('%s declares the layer order before any rule', (path) => {
    const css = readFileSync(path, 'utf8')
    const declaration = css.indexOf(LAYER_DECLARATION)
    expect(declaration, `${path} has no layer declaration`).toBeGreaterThanOrEqual(0)
    // Nothing but a comment may precede it.
    const before = css.slice(0, declaration).replace(/\/\*[\s\S]*?\*\//g, '').trim()
    expect(before).toBe('')
  })

  it('orders reset < tokens < components, which is the contract', () => {
    expect(LAYER_NAMES).toEqual(['clara.reset', 'clara.tokens', 'clara.components'])
  })

  it('an unlayered consumer rule outranks every Clara layer', () => {
    // The guarantee restated as the cascade defines it: unlayered styles are applied last, so a
    // consumer needs no !important. If Clara ever emitted a rule outside a layer, that rule would
    // compete with the consumer's - which is what check-stylesheets refuses.
    const sheet = readFileSync('packages/react/dist/styles.css', 'utf8')
    const afterDeclaration = sheet.slice(sheet.indexOf(LAYER_DECLARATION) + LAYER_DECLARATION.length)
    const outsideAnyLayer = afterDeclaration.replace(/@layer[^{]*\{[\s\S]*\}/, '').trim()
    expect(outsideAnyLayer, 'Clara emitted a rule outside a layer').toBe('')
    expect(sheet).not.toMatch(/!important/)
  })

  it('is idempotent - a second pass cannot create a second declaration', () => {
    const once = applyCascadeLayer(':root{--x:1}', 'clara.components')
    expect(applyCascadeLayer(once, 'clara.components')).toBe(once)
    expect((once.match(/@layer clara\.reset/g) ?? []).length).toBe(1)
  })

  it('refuses an unknown layer name rather than inventing one', () => {
    expect(() => applyCascadeLayer(':root{--x:1}', 'clara.nope')).toThrow(/unknown Clara layer/)
  })
})
