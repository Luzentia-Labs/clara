/**
 * Every declared token pairing meets its contrast threshold.
 *
 * Under **D0035 clause 2** this is load-bearing rather than advisory: a failing pairing never ships
 * provisional, and F00 does not close on a failing table. It is the gate that decides whether the
 * foundations pass can end, which is why it exists before the pass rather than during it.
 *
 * Two assertions, not one:
 *
 *   1. **Every declared pairing passes.** 4.5:1 for text, 3:1 for non-text (PRD Section 7).
 *   2. **The declared table covers what the PRD requires.** Without this, the cheapest way to make
 *      a red gate green is to delete the failing row - so the required list is committed separately
 *      in `packages/tokens/contrast-required.json`, which the build does not write. Same reasoning
 *      as `tokens.public.lock.json`: a check whose input is authored by the thing being checked is
 *      a witness to internal consistency only.
 *
 * Failures are reported in FULL, with measured ratios and shortfalls. A design pass needs the whole
 * list to choose against; one error at a time turns a five-day box into five one-day boxes.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fail, pass } from './lib/workspace.mjs'
import { contrastRatio } from './lib/wcag.mjs'

const root = process.cwd()
const tokens = join(root, 'packages/tokens')
const THEMES = [
  { name: 'light', path: join(tokens, 'build/tokens.pairings.json') },
  { name: 'dark', path: join(tokens, 'build/tokens.pairings.dark.json') },
]
const pairingsPath = THEMES[0].path
const requiredPath = join(tokens, 'contrast-required.json')

if (!existsSync(pairingsPath)) {
  fail('contrast', [`${pairingsPath.slice(root.length + 1)} missing - build the tokens package first`])
}
if (!existsSync(requiredPath)) {
  fail('contrast', ['contrast-required.json missing - the required pairing list is not committed'])
}

const required = JSON.parse(readFileSync(requiredPath, 'utf8'))
const problems = []

/**
 * Thresholds come from the COMMITTED required file, never from the pairing table being checked.
 * `minRatio` used to be authored in `src/pairings.json` - so downgrading a text pairing from 4.5 to
 * 3.0 silently removed WCAG 1.4.3 for that pair, in the one field the docblock forgot (review X3).
 */
const THRESHOLD = { text: required.thresholds?.text ?? 4.5, nonText: required.thresholds?.nonText ?? 3 }
const nonTextTokens = /border|focus|icon/i
const thresholdFor = (p) =>
  nonTextTokens.test(p.foreground?.token ?? '') ? THRESHOLD.nonText : THRESHOLD.text

// --- 1. every declared pairing passes, IN EVERY THEME --------------------------------------------
let measured = 0
const pairings = JSON.parse(readFileSync(pairingsPath, 'utf8')).pairings
for (const theme of THEMES) {
  if (!existsSync(theme.path)) {
    problems.push(
      `${theme.name} theme pairing table missing (${theme.path.slice(root.length + 1)}). TRD Section 6 ` +
        'requires every pairing to meet its threshold in BOTH themes; a theme with no table is unmeasured.',
    )
    continue
  }
  const list = JSON.parse(readFileSync(theme.path, 'utf8')).pairings ?? []
  if (list.length === 0) {
    problems.push(`${theme.name} theme pairing table is empty - nothing was measured`)
    continue
  }
  for (const p of list) {
    const fg = p.foreground?.value
    const bg = p.background?.value
    const ratio = contrastRatio(fg, bg)
    if (ratio === null) {
      problems.push(
        `[${theme.name}] ${p.foreground?.token} on ${p.background?.token}: cannot measure - not a hex ` +
          `colour (fg=${fg}, bg=${bg})`,
      )
      continue
    }
    measured++
    const min = thresholdFor(p)
    if (ratio < min) {
      problems.push(
        `[${theme.name}] ${p.foreground.token} on ${p.background.token}: ${ratio.toFixed(2)}:1, needs ` +
          `${min}:1 (short by ${(min - ratio).toFixed(2)}). fg ${fg} / bg ${bg}`,
      )
    }
  }
}

// --- 2. no declared pairing may silently disappear -----------------------------------------------
// The required list below covers what the PRD will need; it cannot protect what exists TODAY,
// because the placeholder families do not use the PRD's names. Removing two of three declared
// pairings passed the gate until this was added - the cheapest way to green a red gate is to
// delete the failing row.
// X4/X5 and the N6 vacuous-pass pattern: every assertion here used to optional-chain to an empty
// default, so deleting `declaredLock`, `waived`, `text` or `nonText` turned each check into a
// silent pass. A missing input is now a failure - "not checked" must not read as "checked".
for (const key of ['text', 'nonText', 'declaredLock', 'waived', 'thresholds']) {
  if (!(key in required)) {
    problems.push(`contrast-required.json has no "${key}" - the required table is incomplete, so this gate cannot be trusted`)
  }
}
if (!Array.isArray(required.declaredLock?.pairs)) {
  problems.push('contrast-required.json declaredLock.pairs is missing or not an array - deleting it would silently disable the no-deletion check')
}
const lock = required.declaredLock?.pairs ?? []
const declaredNow = new Set((pairings ?? []).map((p) => `${p.foreground?.token}|${p.background?.token}`))
for (const pinned of lock) {
  if (!declaredNow.has(pinned)) {
    const [fg, bg] = pinned.split('|')
    problems.push(
      `declared pairing "${fg} on ${bg}" has been REMOVED. The pairing list may only grow until the ` +
        'semantic layer lands; removing one needs a recorded decision and a contrast-required.json update.',
    )
  }
}

// --- 3. the declared table covers what the PRD requires -----------------------------------------
const declared = declaredNow
const waived = required.waived ?? {}
const missing = []
for (const [group, min] of [['text', 4.5], ['nonText', 3]]) {
  for (const { fg, bg } of required[group] ?? []) {
    // Required entries name PRD family names; declared pairings use emitted token names. Match on
    // the emitted form once the semantic layer exists.
    const emittedFg = `semantic-${fg}`
    const emittedBg = `semantic-${bg}`
    if (!declared.has(`${emittedFg}|${emittedBg}`)) missing.push(`${fg} on ${bg} (${min}:1)`)
  }
}

if (missing.length) {
  // X4: `count` was a hand-edited integer and nothing enforced "may only shrink" - growing it to 99
  // let 11 required rows be deleted while the banner reported the smaller number as progress. The
  // waiver is now derived from the list itself and capped by a committed high-water mark.
  const cap = Number(waived.highWaterMark ?? waived.count ?? 0)
  const waivedCount = Math.min(Number(waived.count ?? 0), cap)
  if (Number(waived.count ?? 0) > cap) {
    problems.push(
      `the contrast waiver GREW from ${cap} to ${waived.count}. It may only shrink (${waived.until} ` +
        'closes it). Growing a waiver is how a required pairing disappears.',
    )
  }
  if (missing.length > waivedCount) {
    problems.push(
      `${missing.length} required pairing(s) are not declared, but only ${waivedCount} are waived. ` +
        `The waiver in contrast-required.json may only shrink. Undeclared: ${missing.slice(0, 4).join('; ')}` +
        (missing.length > 4 ? ` (+${missing.length - 4} more)` : ''),
    )
  }
}

if (problems.length) fail('contrast', problems)

const note = missing.length
  ? ` - ${missing.length} required pairing(s) WAIVED until ${waived.until} (the tier 2 families do not exist yet)`
  : ''
pass('contrast', `${measured} pairing(s) across ${THEMES.length} theme(s) meet their thresholds${note}`)
