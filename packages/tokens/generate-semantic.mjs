#!/usr/bin/env node
/**
 * Build the tier 2 semantic layer, and the legal pairing table that polices it.
 *
 * Tier 2 is PUBLIC API (D0007), so these names are permanent from the first publish. They come
 * from TRD Section 6 - `neutral`, `accent`, `selected`, the four status intents, across `fg`, `bg`
 * and `border`, plus `fg-readonly` and the two focus tokens - and from the PRD Section 7 pairing
 * table, which names them literally (`fg-default`, `bg-canvas`, `bg-accent-emphasis`, ...).
 * D0044 chose this scheme over the `surface/text/border/action` placeholders that shipped in
 * US-01M0GM9N.
 *
 * The step each token points at is SOLVED, not chosen by eye. Every pairing in Section 7 has a
 * threshold; this walks candidate steps per token and keeps the first assignment where all of
 * them pass in BOTH themes. Idris's condition on F00 was that contrast never ships waived - if a
 * colour cannot carry a pairing, the colour moves. The solver is how that is honoured rather than
 * asserted.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { contrastRatio } from '../../scripts/lib/wcag.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const ramps = JSON.parse(readFileSync(join(here, 'src/primitive/base.json'), 'utf8')).color
const hex = (ramp, step) => ramps[ramp][String(step)].value
const INTENTS = ['accent', 'info', 'success', 'warning', 'danger']

/**
 * Per-token candidate steps, darkest-first for light and lightest-first for dark.
 *
 * A candidate LIST rather than a fixed value is what lets the solver move a colour when a pairing
 * cannot be met, instead of the alternative this project has already rejected once: waiving the
 * pairing and calling the palette done.
 */
const CANDIDATES = {
  light: {
    'fg.default': ['neutral:900'], 'fg.muted': ['neutral:700', 'neutral:600'],
    'fg.link': ['accent:700', 'accent:800'], 'fg.on-emphasis': ['neutral:0', 'neutral:900'],
    'fg.readonly': ['neutral:700', 'neutral:800'], 'fg.disabled': ['neutral:600', 'neutral:700'],
    'bg.canvas': ['neutral:0'], 'bg.surface': ['neutral:0', 'neutral:50'],
    'bg.subtle': ['neutral:100', 'neutral:50'], 'bg.selected': ['accent:100', 'accent:50'],
    'bg.disabled': ['neutral:100', 'neutral:200'],
    'bg.row-striped': ['neutral:50', 'neutral:100'], 'bg.row-hover': ['neutral:100', 'neutral:200'],
    'bg.selected-hover': ['accent:200', 'accent:100'],
    'border.default': ['neutral:500', 'neutral:600'], 'border.strong': ['neutral:700', 'neutral:600'],
    'border.focus': ['accent:700', 'accent:800', 'neutral:900'],
    'border.focus-offset': ['neutral:0', 'neutral:50'], 'border.selected': ['accent:700', 'accent:600'],
  },
  dark: {
    'fg.default': ['neutral:0', 'neutral:50'], 'fg.muted': ['neutral:300', 'neutral:400'],
    'fg.link': ['accent:300', 'accent:200'], 'fg.on-emphasis': ['neutral:0', 'neutral:900'],
    'fg.readonly': ['neutral:300', 'neutral:200'], 'fg.disabled': ['neutral:400', 'neutral:300'],
    'bg.canvas': ['neutral:900'], 'bg.surface': ['neutral:900', 'neutral:800'],
    'bg.subtle': ['neutral:800', 'neutral:700'], 'bg.selected': ['accent:800', 'accent:900'],
    'bg.disabled': ['neutral:800', 'neutral:700'],
    'bg.row-striped': ['neutral:800', 'neutral:700'], 'bg.row-hover': ['neutral:700', 'neutral:600'],
    'bg.selected-hover': ['accent:700', 'accent:600'],
    'border.default': ['neutral:500', 'neutral:400'], 'border.strong': ['neutral:400', 'neutral:300'],
    'border.focus': ['accent:300', 'accent:200', 'neutral:0'],
    'border.focus-offset': ['neutral:900', 'neutral:0'], 'border.selected': ['accent:300', 'accent:400'],
  },
}
for (const theme of ['light', 'dark']) {
  for (const intent of INTENTS) {
    // An emphasis surface carries `fg-on-emphasis` text, so it must be dark enough (light theme)
    // or light enough (dark theme) to do so at 4.5:1. Warning is the hard case the PRD names.
    CANDIDATES[theme][`bg.${intent}-emphasis`] = theme === 'light'
      ? ['600', '700', '800'].map((s) => `${intent}:${s}`)
      : ['400', '500', '300'].map((s) => `${intent}:${s}`)
    CANDIDATES[theme][`bg.${intent}-subtle`] = theme === 'light'
      ? ['50', '100'].map((s) => `${intent}:${s}`)
      : ['900', '800'].map((s) => `${intent}:${s}`)
    CANDIDATES[theme][`fg.${intent}`] = theme === 'light'
      ? ['700', '800', '600'].map((s) => `${intent}:${s}`)
      : ['300', '200', '400'].map((s) => `${intent}:${s}`)
  }
}

/** PRD Section 7, row for row. The COUNT is asserted downstream, so this list is the contract. */
export function pairings () {
  const rows = []
  const text = (fg, bg, note) => rows.push({ foreground: fg, background: bg, minRatio: 4.5, role: 'text', note })
  const nonText = (fg, bg, note) => rows.push({ foreground: fg, background: bg, minRatio: 3, role: 'non-text', note })

  for (const bg of ['bg.canvas', 'bg.surface', 'bg.subtle']) text('fg.default', bg, 'primary reading')
  // Row surfaces carry table text, so they are reading pairings like any other background.
  for (const bg of ['bg.row-striped', 'bg.row-hover', 'bg.selected', 'bg.selected-hover']) {
    text('fg.default', bg, 'table row surface (row precedence, D0055)')
  }
  for (const bg of ['bg.canvas', 'bg.surface']) text('fg.muted', bg, 'secondary text')
  for (const bg of ['bg.canvas', 'bg.surface']) text('fg.link', bg, 'plus a non-colour link affordance')
  for (const i of INTENTS) text('fg.on-emphasis', `bg.${i}-emphasis`, i === 'warning' ? 'the hard case (PRD Section 7)' : undefined)
  for (const i of INTENTS) text(`fg.${i}`, `bg.${i}-subtle`, 'intent text on its own subtle surface')
  text('fg.readonly', 'bg.surface', 'F09: readonly is full contrast, not exempt')

  for (const bg of ['bg.canvas', 'bg.surface']) nonText('border.default', bg, 'table rules, card edges, input boundaries')
  for (const bg of ['bg.canvas', 'bg.surface']) nonText('border.strong', bg)
  // The listbox activedescendant CURSOR bar, shared by Select and Combobox (D0124). It is declared
  // because it was NOT: the cursor was a background tint alone, and the only row-hover pairing in
  // this list is `fg.default` ON it, as TEXT - so the state INDICATOR against the surface it sits
  // on was never a pairing at all, and the gate could report PASS over an indicator at 1.14:1.
  nonText('bg.accent-emphasis', 'bg.surface', 'the listbox cursor bar (D0124)')
  // The two-part focus indicator, resolved (D0054). PRD Section 7 lists `border-focus` against
  // every emphasis surface and says in the same breath that a single ring colour CANNOT do this -
  // which is why it specifies a two-part indicator and leaves the resolution to F00. Measured, the
  // single-ring rows come out at 1.5-1.7:1 against 3:1, so this is that resolution rather than a
  // convenience: the OUTER ring contrasts with the surround, the INNER offset contrasts with the
  // ring and sits against the control. Together they are visible on any surface, which is what a
  // single colour cannot promise.
  for (const bg of ['bg.canvas', 'bg.surface', 'bg.subtle']) {
    nonText('border.focus', bg, 'outer ring against the surround')
  }
  nonText('border.focus-offset', 'border.focus', 'the two parts must be distinguishable from each other')
  for (const i of INTENTS) {
    nonText('border.focus-offset', `bg.${i}-emphasis`, 'inner offset against the control it outlines')
  }
  for (const bg of ['bg.selected', 'bg.surface']) nonText('border.selected', bg)
  for (const i of INTENTS) {
    for (const bg of ['bg.canvas', 'bg.surface', `bg.${i}-subtle`]) {
      nonText(`fg.${i}`, bg, 'status icon: icons carry meaning under rule 4')
    }
  }
  nonText('fg.disabled', 'bg.disabled', 'Clara exceeds WCAG here deliberately - an ERP form is often mostly disabled')

  // One row per COLOUR PAIR, carrying the strictest threshold any of its roles demands.
  //
  // PRD Section 7 lists `fg-{intent}` on `bg-{intent}-subtle` twice - once as intent text at 4.5:1
  // and once as a status icon at 3:1. Those are two roles, but one pair of colours: it either
  // reaches 4.5:1 or it does not, and enumerating it twice makes the row count ambiguous while
  // adding no requirement. Merged, with both roles recorded so the reason survives.
  const merged = new Map()
  for (const row of rows) {
    const key = `${row.foreground}|${row.background}`
    const seen = merged.get(key)
    if (!seen) { merged.set(key, { ...row, roles: [row.role] }); continue }
    seen.roles.push(row.role)
    if (row.minRatio > seen.minRatio) { seen.minRatio = row.minRatio; seen.role = row.role }
    if (row.note && !seen.note) seen.note = row.note
  }
  return [...merged.values()]
}

/** First assignment where every pairing passes. Returns null if the ramps cannot do it. */
function solve (theme, rows) {
  const names = Object.keys(CANDIDATES[theme])
  const chosen = Object.fromEntries(names.map((n) => [n, CANDIDATES[theme][n][0]]))
  const ratioOf = (row) => {
    const [fr, fs] = chosen[row.foreground].split(':')
    const [br, bs] = chosen[row.background].split(':')
    return contrastRatio(hex(fr, fs), hex(br, bs))
  }
  // Coordinate descent: repeatedly move whichever token is implicated in a failing pairing to its
  // next candidate. Bounded, and it reports what it could not satisfy rather than looping.
  for (let pass = 0; pass < 400; pass++) {
    const failing = rows.filter((r) => ratioOf(r) < r.minRatio)
    if (!failing.length) return chosen
    let moved = false
    for (const row of failing) {
      for (const token of [row.background, row.foreground]) {
        const options = CANDIDATES[theme][token]
        const at = options.indexOf(chosen[token])
        if (at < options.length - 1) { chosen[token] = options[at + 1]; moved = true; break }
      }
      if (moved) break
    }
    if (!moved) return null
  }
  return null
}

const rows = pairings()
const solved = {}
for (const theme of ['light', 'dark']) {
  solved[theme] = solve(theme, rows)
  if (!solved[theme]) {
    const chosen = Object.fromEntries(Object.keys(CANDIDATES[theme]).map((n) => [n, CANDIDATES[theme][n][0]]))
    console.error(`FAIL [semantic] no assignment satisfies every pairing in the ${theme} theme`)
    for (const r of rows) {
      const [fr, fs] = chosen[r.foreground].split(':')
      const [br, bs] = chosen[r.background].split(':')
      const ratio = contrastRatio(hex(fr, fs), hex(br, bs))
      if (ratio < r.minRatio) console.error(`  ${r.foreground} on ${r.background}: ${ratio.toFixed(2)} < ${r.minRatio}`)
    }
    process.exit(1)
  }
}

const nest = (assignment) => {
  const out = { color: {} }
  for (const [name, pick] of Object.entries(assignment)) {
    const [group, key] = name.split('.')
    const [ramp, step] = pick.split(':')
    out.color[group] = out.color[group] ?? {}
    out.color[group][key] = { value: `{color.${ramp}.${step}}`, type: 'color' }
  }
  return out
}

writeFileSync(join(here, 'src/semantic/color.json'), JSON.stringify(nest(solved.light), null, 2) + '\n')
writeFileSync(join(here, 'src/themes/dark.json'), JSON.stringify(nest(solved.dark), null, 2) + '\n')
mkdirSync(join(here, 'src'), { recursive: true })
writeFileSync(join(here, 'src/pairings.json'), JSON.stringify({
  _comment: 'GENERATED by generate-semantic.mjs from PRD Section 7, row for row. Build-time input only - written to build/, never dist/ (D0029). The row COUNT is asserted, so a pairing silently dropped from the generator fails CI rather than passing vacuously.',
  source: 'PRD Section 7 (Legal Color Pairings)',
  // Full token paths, because the gate resolves them against the built graph. The short names
  // above are what the PRD table calls them; `color.` is where they live.
  pairings: rows.map((r) => ({ ...r, foreground: `color.${r.foreground}`, background: `color.${r.background}` })),
}, null, 2) + '\n')

const report = ['light', 'dark'].map((t) => {
  const worst = rows.map((r) => {
    const [fr, fs] = solved[t][r.foreground].split(':')
    const [br, bs] = solved[t][r.background].split(':')
    return { r, ratio: contrastRatio(hex(fr, fs), hex(br, bs)) }
  }).sort((a, b) => (a.ratio - a.r.minRatio) - (b.ratio - b.r.minRatio))[0]
  return `${t}: tightest ${worst.r.foreground} on ${worst.r.background} = ${worst.ratio.toFixed(2)} (needs ${worst.r.minRatio})`
}).join('; ')
console.log(`PASS [semantic] ${rows.length} pairing(s) satisfied in both themes. ${report}`)
