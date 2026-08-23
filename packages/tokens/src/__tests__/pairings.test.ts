import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
// @ts-expect-error - .mjs helper, no declarations
import { contrastRatio } from '../../../../scripts/lib/wcag.mjs'
// @ts-expect-error - .mjs helper
import { resolveRowSurface, ROW_PRECEDENCE } from '../../../../scripts/lib/row-surface.mjs'

const pkg = join(__dirname, '../..')
const pairings = JSON.parse(readFileSync(join(pkg, 'src/pairings.json'), 'utf8')).pairings
const required = JSON.parse(readFileSync(join(pkg, 'contrast-required.json'), 'utf8'))

/** Resolve a token path to its hex, following {references} through the built graph. */
const ramps = JSON.parse(readFileSync(join(pkg, 'src/primitive/base.json'), 'utf8')).color
const themeSource = (theme: string) => JSON.parse(readFileSync(
  join(pkg, theme === 'dark' ? 'src/themes/dark.json' : 'src/semantic/color.json'), 'utf8')).color
const hexFor = (path: string, theme: string) => {
  const [, group, key] = path.split('.')
  const ref = themeSource(theme)[group][key].value as string
  const [, ramp, step] = ref.replace(/[{}]/g, '').split('.')
  return ramps[ramp][step].value as string
}

describe('pairing row count matches documented table', () => {
  // PRD Section 7 says a pairing silently dropped from the generator must fail CI rather than pass
  // vacuously. The committed contract is the count; the generator is what could drift.
  it('declares exactly as many pairings as the committed contract requires', () => {
    expect(pairings).toHaveLength(required.text.length + required.nonText.length)
  })

  it('declares every required pairing, by emitted token name', () => {
    const declared = new Set(pairings.map((p: { foreground: string, background: string }) =>
      `${p.foreground.replace(/\./g, '-')}|${p.background.replace(/\./g, '-')}`))
    for (const { fg, bg } of [...required.text, ...required.nonText]) {
      expect({ pair: `${fg}|${bg}`, declared: declared.has(`${fg}|${bg}`) })
        .toEqual({ pair: `${fg}|${bg}`, declared: true })
    }
  })

  it('waives nothing', () => {
    expect(required.waived.count).toBe(0)
  })

  // The waiver may only shrink. A future generation of waivers would be a silent regression.
  it('keeps the waiver at or below its high-water mark', () => {
    expect(required.waived.count).toBeLessThanOrEqual(required.waived.highWaterMark)
  })
})

describe('contrast thresholds per role', () => {
  it('sets 4.5:1 for text and 3:1 for non-text, per PRD Section 7', () => {
    expect(required.thresholds).toMatchObject({ text: 4.5, nonText: 3 })
  })

  it('gives every declared pairing the threshold its role demands', () => {
    const textPairs = new Set(required.text.map((r: { fg: string, bg: string }) => `${r.fg}|${r.bg}`))
    for (const p of pairings) {
      const key = `${p.foreground.replace(/\./g, '-')}|${p.background.replace(/\./g, '-')}`
      expect({ key, min: p.minRatio }).toEqual({ key, min: textPairs.has(key) ? 4.5 : 3 })
    }
  })
})

describe('contrast in both themes', () => {
  it.each(['light', 'dark'])('every declared pairing meets its threshold in %s', (theme) => {
    const failures = pairings
      .map((p: { foreground: string, background: string, minRatio: number }) => ({
        pair: `${p.foreground} on ${p.background}`,
        ratio: Number(contrastRatio(hexFor(p.foreground, theme), hexFor(p.background, theme)).toFixed(2)),
        min: p.minRatio,
      }))
      .filter((r: { ratio: number, min: number }) => r.ratio < r.min)
    expect(failures).toEqual([])
  })

  // A theme that resolved every token to the same colour would pass every "ratio >= min" check
  // only if the thresholds were 1 - but it would also make the two themes identical, which is the
  // shape of a build that silently stopped emitting dark.
  it('resolves the two themes to genuinely different colours', () => {
    const differs = pairings.filter((p: { background: string }) =>
      hexFor(p.background, 'light') !== hexFor(p.background, 'dark'))
    expect(differs.length).toBeGreaterThan(pairings.length / 2)
  })
})

describe('row surface precedence', () => {
  it('resolves focus > selected > hover > striped', () => {
    expect(ROW_PRECEDENCE).toEqual(['focused', 'selected', 'hover', 'striped'])
  })

  it.each([
    [{ striped: true }, 'color.bg.row-striped'],
    [{ hover: true }, 'color.bg.row-hover'],
    [{ striped: true, hover: true }, 'color.bg.row-hover'],
    [{ selected: true }, 'color.bg.selected'],
    [{ selected: true, striped: true }, 'color.bg.selected'],
    [{}, 'color.bg.surface'],
  ])('%j resolves to %s', (state, expected) => {
    expect(resolveRowSurface(state).background).toBe(expected)
  })

  // Hovering a selected row must still look selected, or the user loses track of what they picked
  // while reaching for it.
  it('composes selected and hover rather than letting one replace the other', () => {
    expect(resolveRowSurface({ selected: true, hover: true }).background).toBe('color.bg.selected-hover')
  })

  // Focus is drawn OVER the surface, so it never hides the selection underneath.
  it('draws focus as an indicator over the surface, not as a background', () => {
    const focusedSelected = resolveRowSurface({ selected: true, focused: true })
    expect(focusedSelected.background).toBe('color.bg.selected')
    expect(focusedSelected.focusIndicator).toEqual({
      ring: 'color.border.focus', offset: 'color.border.focus-offset',
    })
  })

  it('has no focus indicator when the row is not focused', () => {
    expect(resolveRowSurface({ selected: true }).focusIndicator).toBeNull()
  })
})
