/**
 * `design/foundations.md` records every F00 deliverable, with real values.
 *
 * Replaces three verifiers that tested for the presence of a string:
 *
 *   AC1  file design/foundations.md              -> passes on an empty file
 *   AC2  grep "clara-" design/foundations.md     -> one occurrence anywhere
 *   AC3  grep "minimum internal padding"         -> the phrase, not a number
 *
 * They were weak, and they were also brittle: AC2 and AC3 both went red the moment the document was
 * reworded, while the content they claimed to check had just been ADDED. A verifier that fails when
 * the work is done and passes when it is not is worse than none.
 *
 * This asserts the ten deliverables PRD F00 enumerates are each present with a status, that the
 * colour values are real hex, and that the density floors are NUMBERS with units.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { fail, pass } from './lib/workspace.mjs'
import { contrastRatio } from './lib/wcag.mjs'

const path = 'design/foundations.md'
if (!existsSync(path)) fail('foundations', [`${path} does not exist`])
const doc = readFileSync(path, 'utf8')
const problems = []

/** The ten deliverables PRD F00 lists, by the word that must appear in a status row. */
const DELIVERABLES = [
  ['neutral ramp', /neutral ramp/i],
  ['accent hue', /accent hue/i],
  ['colour space', /colour space|color space/i],
  ['radius', /radius/i],
  ['border weight', /border weight/i],
  ['elevation', /elevation/i],
  ['focus indicator', /focus indicator/i],
  ['type scale', /type scale/i],
  ['pairing table', /pairing table/i],
  ['motion', /motion/i],
]
for (const [name, re] of DELIVERABLES) {
  if (!re.test(doc)) problems.push(`deliverable "${name}" is not recorded (PRD F00 lists all ten)`)
}

// Each must carry a status, so "recorded" cannot mean "mentioned in passing".
const STATUSES = /\*\*(Decided|Provisional|Partial)\*\*/g
const statusCount = (doc.match(STATUSES) ?? []).length
if (statusCount < DELIVERABLES.length) {
  problems.push(
    `only ${statusCount} deliverable status marker(s) found, expected at least ${DELIVERABLES.length} ` +
      '(each deliverable is Decided, Provisional, or Partial - D0035)',
  )
}

// Colour values must be real, not described.
const hexes = doc.match(/#[0-9a-fA-F]{6}\b/g) ?? []
if (hexes.length < 6) {
  problems.push(`only ${hexes.length} hex colour value(s) present; F00 must record actual values, not descriptions`)
}

// AC3: the density floors must be NUMBERS with units, not the phrase.
const padding = doc.match(/(\d+)px/g) ?? []
if (!/internal padding/i.test(doc)) {
  problems.push('no internal padding floor recorded (PRD:312 requires one, fixed in F00)')
}
if (!/adjacent[^.]{0,40}target/i.test(doc)) {
  problems.push('no adjacent-target spacing floor recorded (PRD:312 requires one, fixed in F00)')
}
if (padding.length < 4) {
  problems.push(`only ${padding.length} px value(s) found; the density floors must be numbers with units`)
}

// Every Provisional value needs its revisit condition, or the timebox quietly becomes permanent.
const provisional = (doc.match(/\*\*Provisional\*\*/g) ?? []).length
if (provisional > 0 && !/revisit/i.test(doc)) {
  problems.push(
    `${provisional} deliverable(s) are Provisional but no revisit condition is recorded (D0035 ` +
      'clause 1 requires one - otherwise a provisional value is just an undecided one that shipped)',
  )
}

// Y5: the ramp table was pasted, then went stale when the palette was regenerated - five of six
// rows wrong, and one derived claim ("info.600 carries white at only 4.25") had flipped from
// failing to PASSING, in the direction that changes what the next story builds. Same defect class
// as oklch.mjs being dead code, one layer out. Every hex the document states must be a colour the
// build actually emits.
{
  const cssPath = 'packages/tokens/dist/tokens.css'
  if (!existsSync(cssPath)) {
    problems.push(`${cssPath} missing - cannot verify the documented colours against the build`)
  } else {
    const css = readFileSync(cssPath, 'utf8')
    const shipped = new Set((css.match(/#[0-9a-f]{6}\b/g) ?? []).map((h) => h.toLowerCase()))
    // Scoped to the sections that CLAIM to describe the build. The hard-case table deliberately
    // cites hypothetical ambers to prove no amber works - those are illustrative, and marked so.
    const claimsShipped = doc
      .split(/^## /m)
      .filter((section) => !/^THE HARD CASE/i.test(section) && !/illustrative/i.test(section))
      .join('\n')
    const documented = [...new Set((claimsShipped.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((h) => h.toLowerCase()))]
    const orphans = documented.filter((h) => !shipped.has(h))
    if (orphans.length) {
      problems.push(
        `${orphans.length} colour(s) in ${path} are not emitted by the build: ${orphans.slice(0, 5).join(', ')}` +
          (orphans.length > 5 ? ` (+${orphans.length - 5} more)` : '') +
          '. The document describes a palette the project does not ship - regenerate it from dist/tokens.css.',
      )
    }
  }
}

/**
 * The two-part panel boundary (D0092/D0093), re-measured from the shipped tokens.
 *
 * Elevation is deferred, and the reason it can be deferred is a measurement: a portalled panel is
 * distinguishable because ONE of two cues clears the 3:1 non-text floor against the composited
 * scrim, and it is a DIFFERENT cue in each theme - the panel surface in light, the 1px border in
 * dark. Exactly the structure of the two-part focus indicator (D0054).
 *
 * That was prose in `design/foundations.md` and nothing re-derived it: the scrim could be moved to
 * an alpha that fails D0092's reasoning with the full suite, the contrast gate and the token gate
 * all green.
 *
 * WHAT THIS ENFORCES, precisely - an earlier version of this comment implied more. Three floors:
 * one of the two cues clears 3:1 against the composited scrim in each theme; the scrim reduces the
 * canvas luminance by at least 25%; and page text behind it stays above 4.5:1. It does NOT enforce
 * D0092's chosen 0.50, and it does NOT reject the 0.40-0.45 band D0092 avoids - at 0.42 the light
 * panel cue is 3.03:1, which clears the floor. D0092 chose 0.50 for margin; this guard holds the
 * floor. A reviewer checked exactly that and was right to.
 *
 * It cannot live in `contrast-required.json`: `contrastRatio` takes 6-digit hex only, so an alpha
 * value returns null and reddens that gate as "cannot measure"; and there is no single honest pair
 * to add, because each candidate pair passes in one theme and fails in the other. A two-part rule
 * needs a two-part check, which is what this is.
 */
const NON_TEXT_FLOOR = 3
const parseHex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const over = (fg, bg, alpha) => {
  const [f, b] = [parseHex(fg), parseHex(bg)]
  return '#' + f.map((c, i) => Math.round(c * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('')
}

const tokenSrc = (f) => JSON.parse(readFileSync(`packages/tokens/src/${f}`, 'utf8'))
const t1 = tokenSrc('primitive/base.json').color
const alphaPrimitives = existsSync('packages/tokens/src/primitive/alpha.json') ? tokenSrc('primitive/alpha.json').color : {}
// EVERY semantic source, not just color.json. The scrim deliberately lives in overlay.json
// (generate-semantic.mjs rewrites color.json wholesale), so reading one file silently skipped the
// whole measurement below - the guard passed on every mutant because it never ran.
const semantic = readdirSync('packages/tokens/src/semantic')
  .filter((f) => f.endsWith('.json'))
  .reduce((acc, f) => {
    for (const [family, roles] of Object.entries(tokenSrc(`semantic/${f}`).color ?? {})) {
      acc[family] = { ...(acc[family] ?? {}), ...roles }
    }
    return acc
  }, {})
const darkOverrides = tokenSrc('themes/dark.json').color
const deref = (value, theme) => {
  const m = /^\{color\.([\w-]+)\.([\w-]+)\}$/.exec(value)
  if (!m) return value
  const group = t1[m[1]] ?? alphaPrimitives[m[1]]
  return group?.[m[2]]?.value ?? value
}
const role = (path, theme) => {
  const [family, name] = path.split('.')
  const src = theme === 'dark' ? (darkOverrides[family]?.[name] ?? semantic[family]?.[name]) : semantic[family]?.[name]
  return src ? deref(src.value, theme) : undefined
}

const scrimRaw = semantic.bg?.scrim ? deref(semantic.bg.scrim.value, 'light') : undefined
if (scrimRaw) {
  const alphaMatch = /^#[0-9a-f]{6}([0-9a-f]{2})$/i.exec(scrimRaw)
  if (!alphaMatch) {
    problems.push(`color.bg.scrim resolves to "${scrimRaw}", which carries no alpha channel - a scrim with no alpha is an opaque panel`)
  } else {
    const alpha = parseInt(alphaMatch[1], 16) / 255
    const ink = scrimRaw.slice(0, 7)
    for (const theme of ['light', 'dark']) {
      const canvas = role('bg.canvas', theme)
      const panel = role('bg.surface', theme)
      const border = role('border.default', theme)
      if (!canvas || !panel || !border) continue
      const composited = over(ink, canvas, alpha)
      const panelVsScrim = contrastRatio(panel, composited)
      const borderVsScrim = contrastRatio(border, composited)
      if (Math.max(panelVsScrim, borderVsScrim) < NON_TEXT_FLOOR) {
        problems.push(
          `${theme}: a portalled panel has NO cue clearing ${NON_TEXT_FLOOR}:1 against the scrim - ` +
            `panel ${panelVsScrim.toFixed(2)}:1, border ${borderVsScrim.toFixed(2)}:1. ` +
            'Elevation is deferred (D0093) only because one of the two always clears it; if neither does, ' +
            'the deferral is no longer justified and deliverable 6 has to be decided.',
        )
      }
      // A scrim must actually DIM, and that is a separate property from the boundary rule above.
      // `neutral.900` at 50% over the dark canvas composites to the canvas itself - a scrim that
      // does literally nothing - and the two-part rule still passes it, because the dark BORDER cue
      // carries the panel on its own. This is why the scrim is true black rather than a ramp step.
      //
      // Measured as a LUMINANCE reduction, not as a contrast ratio: near 1.0 the ratio compresses
      // hard, and the real dark value (1.15:1) sits close enough to the do-nothing case (1.00:1)
      // that no honest threshold separates them. In luminance the same pair is a 57% reduction
      // versus 0%, which is not a close call.
      const relLum = (hex) => {
        const [r, g, b] = parseHex(hex).map((c) => {
          const v = c / 255
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
      }
      const before = relLum(canvas)
      const reduction = before === 0 ? 1 : 1 - relLum(composited) / before
      if (reduction < 0.25) {
        problems.push(
          `${theme}: the scrim composites to ${composited} over a ${canvas} canvas, reducing luminance by ` +
            `${(reduction * 100).toFixed(0)}% - it barely dims the page. A scrim built from the neutral ramp ` +
            'rather than from true black does exactly this in dark theme (D0092).',
        )
      }

      // The page behind must stay readable, which is what pins the alpha's UPPER bound (D0092).
      const text = role('fg.default', theme)
      if (text) {
        const legible = contrastRatio(over(ink, text, alpha), composited)
        if (legible < 4.5) {
          problems.push(
            `${theme}: page text behind the scrim measures ${legible.toFixed(2)}:1, below the 4.5:1 reading floor - ` +
              'the scrim is meant to be translucent so the user keeps their place (D0092)',
          )
        }
      }
    }
  }
}

if (problems.length) fail('foundations', problems)
pass(
  'foundations',
  `${DELIVERABLES.length} deliverables recorded with status, ${hexes.length} real colour values, ` +
    `density floors are numbers, ${provisional} provisional value(s) carry a revisit condition`,
)
