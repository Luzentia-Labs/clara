/**
 * Generate the tier 1 colour ramps from their OKLCH specification.
 *
 * `design/foundations.md` says "every colour here was generated in OKLCH". That was true of how the
 * values were produced, but `oklch.mjs` had **zero importers** - the hex was pasted in, so the claim
 * was unreproducible and drift between the spec and the committed values was undetectable
 * (review X11). This file is the generator, and `check-token-output` asserts the committed values
 * still match what it produces.
 *
 * Out-of-gamut requests are reported rather than silently clipped: `encode()` clamps, which means a
 * requested OKLCH can come back as a different colour with no signal. Any channel that clamps is
 * listed, because a token whose value is silently not what was specified is worse than a build error.
 */
import { writeFileSync } from 'node:fs'
import { oklchToRgb, oklch } from '../../scripts/lib/oklch.mjs'

export const STEPS = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
export const LIGHTNESS = [1.0, 0.976, 0.955, 0.905, 0.845, 0.76, 0.66, 0.56, 0.455, 0.345, 0.235]
/** D0036: slightly warm neutral. Warmth peaks mid-ramp so white stays white and 900 does not go brown. */
export const NEUTRAL_CHROMA = [0, 0.0035, 0.0045, 0.006, 0.007, 0.0075, 0.007, 0.006, 0.005, 0.0038, 0.0028]
/**
 * Capped to the sRGB gamut at every step, across every hue Clara uses.
 *
 * The first curve peaked at 0.185 and put **25 of 66 steps out of gamut**, where `encode()` clamped
 * them silently - so a third of the palette was not the colour the spec requested, and the
 * "perceptually uniform" claim did not hold (review X11). These values are the measured ceiling:
 * the largest chroma that stays in gamut for accent, danger, warning, success and info alike.
 */
export const HUE_CHROMA = [0, 0.01, 0.02, 0.045, 0.075, 0.12, 0.135, 0.115, 0.095, 0.07, 0.045]
export const RAMPS = {
  neutral: { hue: 75, chroma: NEUTRAL_CHROMA },
  accent: { hue: 275, chroma: HUE_CHROMA },
  danger: { hue: 25, chroma: HUE_CHROMA },
  warning: { hue: 75, chroma: HUE_CHROMA },
  success: { hue: 150, chroma: HUE_CHROMA },
  info: { hue: 235, chroma: HUE_CHROMA },
}

/** @returns {{ramps: Record<string,Record<string,string>>, clipped: string[]}} */
export function generateRamps () {
  const ramps = {}
  const clipped = []
  for (const [name, { hue, chroma }] of Object.entries(RAMPS)) {
    ramps[name] = {}
    STEPS.forEach((step, i) => {
      const [r, g, b] = oklchToRgb(LIGHTNESS[i], chroma[i], hue)
      // encode() clamps to 0..255. If a channel sits at a rail, the request was out of sRGB gamut
      // and the returned colour is NOT the one specified.
      if ([r, g, b].some((c) => c === 0 || c === 255) && chroma[i] > 0.02) {
        clipped.push(`${name}.${step} (L=${LIGHTNESS[i]} C=${chroma[i]} H=${hue})`)
      }
      ramps[name][String(step)] = oklch(LIGHTNESS[i], chroma[i], hue)
    })
  }
  return { ramps, clipped }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { ramps, clipped } = generateRamps()
  const wrap = (v, type) => ({ value: v, type })
  const existing = JSON.parse(await import('node:fs').then((fs) => fs.readFileSync('src/primitive/base.json', 'utf8')))
  existing.color = Object.fromEntries(
    Object.entries(ramps).map(([n, steps]) => [n, Object.fromEntries(Object.entries(steps).map(([s, v]) => [s, wrap(v, 'color')]))]),
  )
  writeFileSync('src/primitive/base.json', JSON.stringify(existing, null, 2) + '\n')
  console.log(`PASS [ramps] ${Object.keys(ramps).length} ramps x ${STEPS.length} steps regenerated from OKLCH`)
  if (clipped.length) {
    console.log(`  NOTE ${clipped.length} step(s) clipped to the sRGB gamut - the returned colour is not the requested one:`)
    for (const c of clipped) console.log(`    ${c}`)
  }
}
