import { expect, test } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'

/**
 * Scoped theming and density reach tier 3 (BG-01M0WQY1).
 *
 * A `var()`-referencing custom property is substituted at computed-value time on the element where
 * it is DECLARED. Tier 3 was declared once at `:root`, so every alias froze to the root's light,
 * comfortable tier 2 and the resulting literal inherited. `<ClaraScope theme="dark">` redefined
 * tier 2 on itself, far too late, and a secondary Button inside it rendered white on a dark
 * surface - PRD F02 and TRD ADR-006's headline capability, inert.
 *
 * This file is the proof, and it can only live in a browser: jsdom does not resolve `var()` at
 * all, so the theming suite that covers this in jsdom sees the correct data attributes on the
 * correct elements and reports success either way.
 *
 * It asserts a RELATIONSHIP - tier 3 equals its own scope's tier 2 - rather than literal colours,
 * so re-tuning the palette does not make it red for the wrong reason.
 */

const root = process.cwd()
const require_ = createRequire(join(root, 'package.json'))
const React = require_('react')
const { renderToStaticMarkup } = require_('react-dom/server')
const C = require_(join(root, 'packages/react/dist/index.cjs'))
const h = React.createElement
const css = (f: string) => readFileSync(join(root, f), 'utf8')

const FIXTURE = join(root, 'e2e/fixtures/scoping.html')

test.beforeAll(() => {
  const probe = (name: string) => h('div', { 'data-probe': name },
    h(C.Button, { size: 'md', variant: 'secondary' }, 'Cancel'))

  const body = renderToStaticMarkup(h(C.ClaraProvider, null,
    probe('root'),
    h(C.ClaraScope, { theme: 'dark' }, probe('dark')),
    h(C.ClaraScope, { density: 'compact' }, probe('compact'))))

  writeFileSync(FIXTURE, `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Clara - scope resolution fixture</title>
<style>${css('packages/tokens/dist/tokens.css')}</style>
<style>${css('packages/tokens/dist/themes/dark.css')}</style>
<style>${css('packages/tokens/dist/themes/compact.css')}</style>
<style>${css('packages/react/dist/styles.css')}</style>
</head><body>${body}</body></html>`)
})

test('every referencing tier 3 alias is re-declared for scopes', () => {
  // The browser assertions below sample two aliases. This one covers all of them, so an alias
  // added at `:root` alone - the exact way this bug arrived - is caught even though no test
  // renders the component that uses it.
  const tier3 = JSON.parse(readFileSync(join(root, 'packages/tokens/build/tier-manifest.json'), 'utf8')).tier3
  const names = new Set(tier3.map((t: { name: string }) => `--clara-${t.name}`))
  const sheet = readFileSync(join(root, 'packages/tokens/dist/tokens.css'), 'utf8')

  // `indexOf` returns -1 when the block is absent, and `slice(-1)` is the sheet's LAST CHARACTER,
  // not ''. So this guard could never fire - it was checking a string that is never empty.
  const blockAt = sheet.indexOf('[data-clara-theme],')
  expect(blockAt, 'dist/tokens.css emits no scope block at all').toBeGreaterThan(-1)
  const scopeBlock = sheet.slice(blockAt)

  const referencing = sheet.split('\n')
    .map((l) => l.match(/^\s*(--clara-[a-z0-9-]+)\s*:.*var\(--clara-/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => m[1])
    .filter((n) => names.has(n))

  expect(referencing.length, 'no referencing tier 3 alias found - the check would be vacuous').toBeGreaterThan(0)
  const missing = [...new Set(referencing)].filter((n) => !scopeBlock.includes(`${n}:`))
  expect(missing, `tier 3 aliases that would freeze at :root:\n  ${missing.join('\n  ')}`).toEqual([])
})

test('a nested dark scope re-resolves tier 3 against its own tier 2', async ({ page }) => {
  await page.goto(`file://${FIXTURE}`)
  const seen = await page.evaluate(() => {
    const read = (probe: string) => {
      const el = document.querySelector(`[data-probe="${probe}"] button`)!
      const s = getComputedStyle(el)
      return {
        background: s.backgroundColor,
        tier3: s.getPropertyValue('--clara-button-secondary-bg').trim(),
        tier2: s.getPropertyValue('--clara-color-bg-surface').trim(),
      }
    }
    return { root: read('root'), dark: read('dark') }
  })

  // The scope was never the broken part - tier 2 always flipped. Assert it still does, so a
  // failure below points at tier 3 rather than leaving both halves suspect.
  expect(seen.dark.tier2, 'the dark scope did not change tier 2 at all').not.toEqual(seen.root.tier2)
  expect(seen.dark.tier3, 'tier 3 did not follow tier 2 into the dark scope').toEqual(seen.dark.tier2)
  expect(seen.root.tier3).toEqual(seen.root.tier2)
  expect(seen.dark.background, 'the rendered background did not change with the scope')
    .not.toEqual(seen.root.background)
})

test('a nested compact scope re-resolves tier 3 against its own tier 2', async ({ page }) => {
  await page.goto(`file://${FIXTURE}`)
  const seen = await page.evaluate(() => {
    const read = (probe: string) => {
      const s = getComputedStyle(document.querySelector(`[data-probe="${probe}"] button`)!)
      return { paddingTop: s.paddingTop, tier2: s.getPropertyValue('--clara-space-control-padding-y').trim() }
    }
    return { root: read('root'), compact: read('compact') }
  })

  expect(seen.compact.tier2, 'the compact scope did not change tier 2 at all').not.toEqual(seen.root.tier2)
  // Button reaches its padding through `--clara-button-padding-y`. Before the fix this stayed at
  // the comfortable 8px inside a compact scope while Input, which references tier 2 directly,
  // correctly moved to 4px - the same freeze, in the dimension that is measurable as geometry.
  expect(seen.compact.paddingTop, 'Button padding did not follow the compact scope')
    .not.toEqual(seen.root.paddingTop)
})
