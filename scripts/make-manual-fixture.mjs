#!/usr/bin/env node
/**
 * Build the pages the two outstanding manual checks need, and serve them.
 *
 * Field AC6 (what VoiceOver speaks) and Input AC4 (what the browser paints when it autofills) are
 * the two criteria in this repo that automation genuinely cannot reach - not for want of trying;
 * the attempts and why each failed are recorded in the two components' verification records. What
 * automation CAN do is remove the setup, so the human part is "look and listen" rather than "build
 * a harness first". That is what this is.
 *
 * Renders the BUILT package, not the source, so what you look at is what a consumer would install.
 *
 *   pnpm build && node scripts/make-manual-fixture.mjs
 */
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const require_ = createRequire(join(root, 'package.json'))
const React = require_('react')
const { renderToStaticMarkup } = require_('react-dom/server')
const C = require_(join(root, 'packages/react/dist/index.cjs'))
const h = React.createElement

const css = (f) => readFileSync(join(root, f), 'utf8')
const page = (title, theme, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${title}</title>
<style>${css('packages/tokens/dist/tokens.css')}</style>
<style>${css('packages/react/dist/styles.css')}</style>
<style>body{margin:0;padding:32px;font-family:system-ui;background:var(--clara-color-bg-default)}
main{max-width:28rem;display:grid;gap:24px}h2{font:600 13px system-ui;margin:0;opacity:.7}</style>
</head><body data-clara-theme="${theme}" data-clara-density="comfortable"><main>${body}</main></body></html>`

const field = (label, props, inputProps = {}) =>
  h(C.Field, { label, ...props }, h(C.Input, { ...inputProps }))

// Check 1: what VoiceOver says. Three variants, because "announced twice" and "out of order" are
// only visible by comparing the error case against the one without one.
const voiceover = page('Clara - VoiceOver check (Field AC6)', 'light', renderToStaticMarkup(
  h(React.Fragment, null,
    h('section', { key: 1 }, h('h2', null, 'A - label, description AND error'),
      field('Supplier reference', {
        description: 'As it appears on the invoice',
        error: 'This supplier is not on the approved list',
      }, { name: 'supplier' })),
    h('section', { key: 2 }, h('h2', null, 'B - label and description, no error'),
      field('Supplier reference', { description: 'As it appears on the invoice' }, { name: 'supplier2' })),
    h('section', { key: 3 }, h('h2', null, 'C - required'),
      field('Supplier reference', { description: 'As it appears on the invoice', required: true }, { name: 'supplier3' })),
  )))

// Check 2: autofill. A real address form, so the browser recognises it and offers to fill it. The
// last field carries an error, because "is the error still distinguishable once autofilled" is one
// of the four questions and needs the two states on screen together.
const autofillBody = (theme) => page(`Clara - autofill check (Input AC4, ${theme})`, theme, renderToStaticMarkup(
  h('form', { method: 'post', action: '#' },
    field('Full name', {}, { name: 'name', autoComplete: 'name' }),
    field('Organization', { description: 'As it appears on the invoice' }, { name: 'organization', autoComplete: 'organization' }),
    field('Street address', {}, { name: 'address-line1', autoComplete: 'address-line1' }),
    field('City', {}, { name: 'address-level2', autoComplete: 'address-level2' }),
    field('Postal code', { error: 'That postcode is not in the delivery area' },
      { name: 'postal-code', autoComplete: 'postal-code' }),
    h('button', { type: 'submit', className: 'clara-button clara-button--primary clara-button--md' }, 'Save supplier'),
  )))

const pages = {
  '/': `<!doctype html><meta charset="utf-8"><title>Clara manual checks</title>
<body style="font:16px/1.6 system-ui;max-width:34rem;margin:3rem auto;padding:0 1rem">
<h1>Two manual checks</h1>
<p>Both are described in <code>sdlc-studio/reviews/manual-checks-field-input.md</code>.</p>
<ol>
<li><a href="/voiceover.html">Field AC6 - VoiceOver</a> (Safari, VoiceOver on with Cmd+F5)</li>
<li><a href="/autofill-light.html">Input AC4 - autofill, light</a> and
    <a href="/autofill-dark.html">dark</a> (Chrome and Safari, with an address saved)</li>
</ol></body>`,
  '/voiceover.html': voiceover,
  '/autofill-light.html': autofillBody('light'),
  '/autofill-dark.html': autofillBody('dark'),
}

const port = Number(process.argv[2] ?? 4173)
createServer((req, res) => {
  const body = pages[req.url.split('?')[0]]
  res.writeHead(body ? 200 : 404, { 'content-type': 'text/html; charset=utf-8' })
  res.end(body ?? 'not found')
}).listen(port, '127.0.0.1', () => {
  console.log(`Manual-check fixtures: http://127.0.0.1:${port}/`)
  console.log('  Field AC6  -> /voiceover.html      (Safari + VoiceOver)')
  console.log('  Input AC4  -> /autofill-light.html (Chrome and Safari, address saved)')
  console.log('Ctrl+C to stop.')
})

// Also drop the pages on disk, for opening in a browser that will not reach localhost.
const dir = mkdtempSync(join(tmpdir(), 'clara-manual-'))
for (const [route, body] of Object.entries(pages)) {
  if (route === '/') continue
  writeFileSync(join(dir, route.slice(1)), body)
}
console.log(`Also written to ${dir}`)
