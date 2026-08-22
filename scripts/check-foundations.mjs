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
import { readFileSync, existsSync } from 'node:fs'
import { fail, pass } from './lib/workspace.mjs'

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

if (problems.length) fail('foundations', problems)
pass(
  'foundations',
  `${DELIVERABLES.length} deliverables recorded with status, ${hexes.length} real colour values, ` +
    `density floors are numbers, ${provisional} provisional value(s) carry a revisit condition`,
)
