/**
 * WCAG 2.x relative luminance and contrast ratio.
 *
 * Deliberately its own module with no dependencies: this is the arithmetic every accessibility
 * claim in Clara rests on, and it is short enough to read in full and verify against the spec.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */

/** sRGB channel linearisation, per the WCAG definition. */
const linear = (channel) => {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** Accepts #rgb and #rrggbb. Returns null for anything it cannot parse, rather than guessing. */
export function parseHex (value) {
  if (typeof value !== 'string') return null
  const hex = value.trim().replace(/^#/, '')
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
}

export function relativeLuminance (rgb) {
  const [r, g, b] = rgb.map(linear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Contrast ratio, 1..21. Order-independent, as the spec defines it. */
export function contrastRatio (hexA, hexB) {
  const a = parseHex(hexA)
  const b = parseHex(hexB)
  if (!a || !b) return null
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
