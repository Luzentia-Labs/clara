import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * A theme is not only a set of custom properties.
 *
 * `color-scheme` tells the user agent which livery to paint its OWN controls in. Clara declared it
 * nowhere, and `styles.css` sets `appearance: auto` on checkbox, radio and switch - so every
 * UA-painted control in a dark Clara application rendered in LIGHT livery: glyphs, scrollbars, the
 * NumberInput spinners, native pickers, the autofill tint (BG-01M0W799).
 *
 * Asserted against the BUILT stylesheets rather than the source, because the declaration is
 * injected by the token build and the thing that ships is what matters. Reading dist means these
 * tests need a build first; that is the same trade `check-token-output` already makes.
 */
const pkg = join(__dirname, '../..')
const sheet = (rel: string) => {
  const path = join(pkg, rel)
  expect(existsSync(path), `${rel} was not emitted - run \`pnpm build\` first`).toBe(true)
  return readFileSync(path, 'utf8')
}

describe('the theme declares a colour scheme', () => {
  it('declares light on the base', () => {
    expect(sheet('dist/tokens.css')).toMatch(/color-scheme:\s*light/)
  })

  it('declares dark on the dark theme', () => {
    expect(sheet('dist/themes/dark.css')).toMatch(/color-scheme:\s*dark/)
  })

  it('puts it on the THEME selector, so it follows a scope rather than only the document root', () => {
    // PRD F02: a theme activates via `data-clara-theme` on any ancestor. A `color-scheme` parked on
    // `:root` in the dark sheet would leave a dark ClaraScope inside a light page with light
    // controls - the defect this fixes, one level down.
    const dark = sheet('dist/themes/dark.css')
    const block = /\[data-clara-theme="dark"\]\s*\{([^}]*)\}/.exec(dark)
    expect(block, 'the dark theme selector block was not found').not.toBeNull()
    expect(block![1]).toMatch(/color-scheme:\s*dark/)
  })

  it('declares BOTH halves, because the defect is symmetric', () => {
    // Without `light` on the base, a user agent in dark OS mode paints DARK controls on Clara's
    // light theme. Fixing one half only would be worse than fixing neither, because it would look
    // handled.
    expect(sheet('dist/tokens.css')).toMatch(/color-scheme:\s*light/)
    expect(sheet('dist/themes/dark.css')).toMatch(/color-scheme:\s*dark/)
  })

  it('does not put one on the density sheet, which is not a colour scheme', () => {
    expect(sheet('dist/themes/compact.css')).not.toMatch(/color-scheme/)
  })
})
