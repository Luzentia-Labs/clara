/**
 * An overlay must USE the mechanisms US-01M0GM61 built for it.
 *
 * That story headlines "one portal mechanism" and "the scoping problem is solved once in the
 * architecture rather than nine times in props", and until this guard existed nothing said so.
 * `Modal` renders through `ClaraPortal`; the other eleven could each reach for `Popover.Portal`,
 * `Tooltip.Portal` or `Toast.Viewport` instead and get no scope attributes, no open-order host and
 * no layer token, with every gate in the repo green - including the browser scoping gate, because
 * that renders a bare `ClaraPortal` rather than a component.
 *
 * This is verbatim the defect D0087 records about the z-index scale: "A scale nothing obliges a
 * component to use is exactly the defect the story exists to prevent." The same sentence was true
 * of the portal for as long as the portal existed (US-01M0GM61 round 6).
 *
 * Two requirements, both read from source rather than inferred from a name:
 *
 *   1. The component renders `ClaraPortal`. Radix's own portal primitives are refused BY NAME,
 *      because they are the specific wrong answer an author reaches for - and TRD ADR-006 is the
 *      reason: a Radix portal drops the content on `document.body` with no `data-clara-*`, so a
 *      dark scope stops at the trigger.
 *   2. Its stacking comes from a layer token. `z-index: auto` is what a surface gets when nobody
 *      thought about it, and no other guard objects: the z-index rule is a DENYLIST against
 *      hand-typed numbers, so declaring nothing passes it.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fail, pass } from './lib/workspace.mjs'

const RULE = 'overlay-contract'
const root = process.cwd()
const problems = []

const classification = JSON.parse(readFileSync(join(root, 'packages/react/client-boundary.json'), 'utf8'))
const overlays = classification.components.filter((c) => c.overlay === true)
const built = overlays.filter((c) => c.status === 'built')

// A guard that enumerates nothing passes for the wrong reason. Both halves are checked: the flag
// must exist on somebody, and at least one flagged component must actually be built - otherwise
// this file reports success over an empty loop for as long as the epic takes.
if (!overlays.length) problems.push('client-boundary.json flags no component `overlay: true` - this guard would be vacuous')
if (!built.length) problems.push('no flagged overlay is built yet, so this guard checks nothing - it must not report success')

/** Every source file belonging to one component, minus its tests. */
const sourcesFor = (name) => {
  const dir = join(root, 'packages/react/src/components', name)
  if (!existsSync(dir)) return []
  const walk = (p) => statSync(p).isDirectory()
    ? readdirSync(p).flatMap((e) => (e === '__tests__' ? [] : walk(join(p, e))))
    : [p]
  return walk(dir).filter((f) => (f.endsWith('.tsx') || f.endsWith('.ts')) && !f.endsWith('.stories.tsx'))
}

const stylesheet = readFileSync(join(root, 'packages/react/src/styles.css'), 'utf8')

for (const { name } of built) {
  const files = sourcesFor(name)
  if (!files.length) {
    problems.push(`${name} is classified as a built overlay but has no source directory`)
    continue
  }

  const source = files.map((f) => readFileSync(f, 'utf8')).join('\n')
  const where = relative(root, join('packages/react/src/components', name))

  if (!/\bClaraPortal\b/.test(source)) {
    problems.push(
      `${where}: ${name} is an overlay and does not render through ClaraPortal - a portal that ` +
      'does not carry the scope drops a dark subtree back to the page theme (TRD ADR-006)',
    )
  }

  // Named explicitly: this is the substitution the guard exists to catch, not a hypothetical.
  const radixPortal = source.match(/\b(\w+)\.Portal\b/)
  if (radixPortal) {
    problems.push(
      `${where}: ${name} renders \`${radixPortal[0]}\` - a Radix portal drops its content on ` +
      '`document.body` with no `data-clara-*`, so the scope stops at the trigger. Use ClaraPortal',
    )
  }

  // The stacking half. Read from the stylesheet, because that is where a z-index legally lives.
  const selectors = new RegExp(`\\.clara-${name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}[^{]*\\{[^}]*\\}`, 'g')
  const rules = stylesheet.match(selectors) ?? []
  if (!rules.length) {
    problems.push(`${where}: ${name} is an overlay with no stylesheet rule, so it can carry no layer token`)
  } else if (!rules.some((r) => /z-index:\s*var\(--clara-layer-/.test(r))) {
    problems.push(
      `${where}: ${name} is an overlay and no rule of its own takes \`z-index\` from a layer ` +
      'token. A surface nobody gave a z-index gets `auto`, and the z-index rule is a denylist ' +
      'against hand-typed numbers, so declaring nothing passes it (D0087)',
    )
  }
}

if (problems.length) fail(RULE, problems)
pass(RULE, `${built.length} built overlay(s) of ${overlays.length} flagged: each renders through ClaraPortal and takes its stacking from a layer token`)
