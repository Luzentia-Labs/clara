/**
 * Render the geometry fixture from the BUILT package.
 *
 * Gate 9 asserts TSD Section 7: control heights, target size, type floors and adjacent-target
 * spacing. Every one of those is a claim about a box the browser laid out, so the fixture renders
 * real components and Playwright measures them - `getComputedStyle` and `getBoundingClientRect`,
 * not token arithmetic.
 *
 * It renders from `packages/react/dist`, not from source, for the same reason
 * `make-manual-fixture.mjs` does: the tokens, the cascade layers and the CSS ordering only exist
 * in the built artifact, and the built artifact is what a consumer installs. A fixture built from
 * source could pass while the published package is wrong.
 *
 * THIS SCRIPT NEVER WRITES OUTSIDE ITS `out` PATH.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const here = dirname(fileURLToPath(import.meta.url))
const defaultRoot = join(here, '..')

/** Everything the fixture inlines. A missing one is a stale or absent build, not a test failure. */
const REQUIRED = [
  'packages/react/dist/index.cjs',
  'packages/react/dist/styles.css',
  'packages/tokens/dist/tokens.css',
  'packages/tokens/dist/themes/compact.css',
]

export class FixtureBuildError extends Error {}

export function buildGeometryFixture ({ root = defaultRoot, out } = {}) {
  const missing = REQUIRED.filter((f) => !existsSync(join(root, f)))
  if (missing.length) {
    // Loud, not silent. A fixture that renders an empty page would make every assertion below
    // vacuous, and a gate that passes because it measured nothing is worse than no gate.
    throw new FixtureBuildError(
      `cannot build the geometry fixture - run \`pnpm build\` first. Missing:\n  ${missing.join('\n  ')}`,
    )
  }

  const require_ = createRequire(join(root, 'package.json'))
  const React = require_('react')
  const { renderToStaticMarkup } = require_('react-dom/server')
  const C = require_(join(root, 'packages/react/dist/index.cjs'))
  const h = React.createElement
  const css = (f) => readFileSync(join(root, f), 'utf8')

  const icon = h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', 'aria-hidden': true },
    h('path', { d: 'M2 8h12', stroke: 'currentColor', strokeWidth: 2 }))

  /** One measurable case. `kind` selects which assertions the spec applies. */
  const kase = (id, kind, node) => h('div', { key: id, 'data-case': id, 'data-kind': kind }, node)

  // Cases are rendered once per density. Theme is deliberately NOT varied: geometry is a
  // density and type-scale property, and a theme that changed a control's height would be a
  // separate defect that gate 8's contrast work and gate 7's baselines are the right shape for.
  const cases = () => [
    // --- control height: 40px comfortable, 32px compact (TSD 7 rows 1-2) ---
    kase('button-md', 'control', h(C.Button, { size: 'md' }, 'Save')),
    kase('iconbutton-md', 'control', h(C.IconButton, { size: 'md', label: 'Edit', icon })),
    kase('input-md', 'control', h(C.Input, { size: 'md', defaultValue: 'ACME-1042', 'aria-label': 'Reference' })),
    kase('numberinput-md', 'control', h(C.NumberInput, { size: 'md', defaultValue: 12, 'aria-label': 'Quantity' })),
    kase('passwordinput-md', 'control', h(C.PasswordInput, { defaultValue: 'hunter2', 'aria-label': 'Password' })),
    kase('searchinput-md', 'control', h(C.SearchInput, { defaultValue: 'widget', 'aria-label': 'Search' })),

    // --- target size: >= 24x24 hit area in BOTH densities (TSD 7 row 3, PRD:311, PRD:486) ---
    kase('target-button', 'target', h(C.Button, { size: 'md' }, 'Post')),
    kase('target-iconbutton', 'target', h(C.IconButton, { size: 'md', label: 'Remove', icon })),
    kase('target-checkbox', 'target', h(C.Checkbox, { label: 'Approved', defaultChecked: true })),
    kase('target-switch', 'target', h(C.Switch, { label: 'Notify me' })),
    // `sm` was absent from the first fixture, which is exactly how `.clara-input--sm` shipped a
    // 16px floor under a 24px target minimum (BG-01M0WR22). A size the gate does not render is a
    // size the gate does not hold.
    kase('target-button-sm', 'target', h(C.Button, { size: 'sm' }, 'Undo')),
    kase('target-input-sm', 'target', h(C.Input, { size: 'sm', defaultValue: 'x', 'aria-label': 'Code' })),
    kase('target-textarea', 'target', h(C.Textarea, { defaultValue: 'note', 'aria-label': 'Notes' })),
    // A tag's remove control is the smallest thing a user is asked to hit accurately, and it is
    // hit under time pressure in a filter bar. Its stylesheet claims gate 9 measures it, so it
    // is rendered here rather than left as a comment nothing checks.
    kase('target-tag-remove', 'target', h(C.Tag, { intent: 'warning', onRemove: () => {} }, 'Overdue')),
    kase('target-alert-dismiss', 'target', h(C.Alert, { intent: 'info', onDismiss: () => {} }, 'Saved.')),
    kase('target-radio', 'target', h(C.RadioGroup, {
      legend: 'Terms', name: 'terms', defaultValue: 'net30',
      options: [{ value: 'net30', label: 'Net 30' }, { value: 'net60', label: 'Net 60' }],
    })),

    // --- motion: a busy indicator's liveness is the information (D0100) ---
    // Rendered here so gate 9 can read what the browser computed. jsdom returns no animation at
    // all, so a green unit test asserting this would be a false green by construction.
    kase('motion-button-loading', 'motion', h(C.Button, { size: 'md', loading: true }, 'Saving')),
    kase('motion-spinner', 'motion', h(C.Spinner, { label: 'Loading invoices' })),

    // --- type floor: body never below 14px in any density (TSD 7 row 4, PRD:333) ---
    kase('text-body', 'text', h(C.Text, null, 'Total payable on the agreed terms.')),
    kase('text-field', 'text', h(C.Field, { label: 'Supplier reference', description: 'As it appears on the invoice' },
      h(C.Input, { defaultValue: 'ACME-1042' }))),

    // --- adjacent target spacing: 4px compact / 8px comfortable (TSD 7 row 5, D0037) ---
    // ButtonGroup is the subject because it is the one component that consumes
    // `--clara-space-adjacent-target` as its flex gap. foundations.md:238 records that this floor
    // was decided but never exercised against a real component; this is that exercise.
    kase('spacing-buttongroup', 'spacing', h(C.ButtonGroup, { label: 'Row actions' },
      h(C.Button, { key: 'a', size: 'md' }, 'Edit'),
      h(C.Button, { key: 'b', size: 'md' }, 'Copy'),
      h(C.Button, { key: 'c', size: 'md' }, 'Delete'))),
  ]

  const scopes = ['comfortable', 'compact'].map((density) =>
    h('section', { key: density, 'data-density-scope': density },
      h('h2', null, density),
      h(C.ClaraScope, { density }, ...cases())))

  const body = renderToStaticMarkup(h(C.ClaraProvider, null, ...scopes))

  // The theme and density OVERRIDES are separate stylesheets - inlining only tokens.css leaves
  // `data-clara-density="compact"` with nothing to apply, and every compact assertion would then
  // measure the comfortable scale under a compact name.
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Clara - computed geometry fixture (gate 9, TSD 7)</title>
<style>${css('packages/tokens/dist/tokens.css')}</style>
<style>${css('packages/tokens/dist/themes/compact.css')}</style>
<style>${css('packages/react/dist/styles.css')}</style>
<style>
  body { margin: 0; padding: 24px; font-family: system-ui;
         background: var(--clara-color-bg-canvas); color: var(--clara-color-fg-default) }
  section { margin-bottom: 32px }
  h2 { font: 600 13px system-ui; margin: 0 0 12px; opacity: .7 }
  /* Cases are laid out with generous room so nothing is squashed by the fixture itself. A
     fixture that constrains a control would report the fixture's bug as the component's. */
  [data-case] { margin-bottom: 20px; max-width: 32rem }
</style>
</head><body>${body}</body></html>`

  if (out) writeFileSync(out, html)
  return html
}

// CLI: `node scripts/build-geometry-fixture.mjs [out]`
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const out = process.argv[2] ?? join(defaultRoot, 'e2e/fixtures/geometry.html')
  try {
    buildGeometryFixture({ out })
    console.log(`geometry fixture written to ${out}`)
  } catch (error) {
    console.error(error instanceof FixtureBuildError ? error.message : error)
    process.exit(1)
  }
}
