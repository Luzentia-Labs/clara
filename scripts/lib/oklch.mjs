/**
 * OKLCH -> sRGB hex.
 *
 * D0036 fixes OKLCH as the ramp generation space because its lightness is perceptually uniform:
 * step 5 of the neutral ramp and step 5 of the indigo ramp look equally light, which HSL cannot
 * promise. Browser support is irrelevant - this runs at build time and emits hex.
 *
 * Matrices are Björn Ottosson's OKLab definition (https://bottosson.github.io/posts/oklab/).
 * Kept dependency-free and short for the same reason as wcag.mjs: every colour Clara ships is
 * produced here, so it must be readable end to end.
 */

/** OKLCH -> OKLab. Hue in degrees. */
const toLab = (L, C, H) => {
  const rad = (H * Math.PI) / 180
  return [L, C * Math.cos(rad), C * Math.sin(rad)]
}

/** Linear-light sRGB channel -> gamma-encoded 0..255. */
const encode = (c) => {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
  return Math.round(Math.min(1, Math.max(0, v)) * 255)
}

export function oklchToRgb (L, C, H) {
  const [ll, aa, bb] = toLab(L, C, H)
  const l = (ll + 0.3963377774 * aa + 0.2158037573 * bb) ** 3
  const m = (ll - 0.1055613458 * aa - 0.0638541728 * bb) ** 3
  const s = (ll - 0.0894841775 * aa - 1.2914855480 * bb) ** 3
  return [
    encode(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    encode(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  ]
}

export const oklch = (L, C, H) =>
  '#' + oklchToRgb(L, C, H).map((v) => v.toString(16).padStart(2, '0')).join('')
