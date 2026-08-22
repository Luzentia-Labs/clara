/**
 * Exactly one stylesheet per package, and every custom property in it `--clara-` prefixed.
 *
 * Two claims that were made and enforced nowhere:
 *
 *   - US-01M0GM9N AC1 states "the package's CSS is compiled to exactly one stylesheet". Its
 *     verifier ran publint and the bundled-peers guard, neither of which counts stylesheets. A
 *     reviewer emitted a second `dist/extra.css` and the AC stayed green (N7). An extra CSS file
 *     in the tarball is an unreachable file that looks exactly like public API.
 *   - D0001 and PRD:244 fix the prefix at `--clara-` "with no exceptions", repo-wide. That was
 *     enforced only inside packages/tokens, so `--brand-accent` shipped from packages/react with
 *     every guard green (N9).
 *
 * The tokens package is the documented exception to the one-stylesheet rule: it publishes
 * `tokens.css` and `themes/dark.css` as separate, individually-named subpaths in the closed
 * exports table, which is the whole point of a theme file.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fail, pass, readWorkspace } from './lib/workspace.mjs'
import { LAYER_DECLARATION, LAYER_NAMES } from './lib/cascade-layer.mjs'

const root = process.cwd()
const problems = []
let total = 0

const walk = (dir) =>
  !existsSync(dir)
    ? []
    : readdirSync(dir).flatMap((n) => {
        if (n === 'node_modules') return []
        const f = join(dir, n)
        return statSync(f).isDirectory() ? walk(f) : [f]
      })

for (const { dir, kind, manifest } of readWorkspace(root)) {
  if (kind !== 'packages' || manifest.private) continue

  const dist = join(root, dir, 'dist')
  const sheets = walk(dist).filter((f) => f.endsWith('.css'))
  total += sheets.length

  // Every emitted stylesheet must be reachable through the closed exports map. An unreachable
  // one is a file in the tarball that looks like API and is not.
  const exported = new Set(
    Object.values(manifest.exports ?? {})
      .flatMap((v) => (typeof v === 'string' ? [v] : Object.values(v).flatMap((x) => (typeof x === 'string' ? [x] : Object.values(x)))))
      .filter((v) => typeof v === 'string' && v.endsWith('.css'))
      .map((v) => join(root, dir, v.replace(/^\.\//, ''))),
  )
  for (const sheet of sheets) {
    if (!exported.has(sheet)) {
      problems.push(
        `${manifest.name}: ${sheet.slice(root.length + 1)} is emitted but no exports subpath ` +
          'reaches it - it would ship in the tarball looking like public API',
      )
    }
  }

  // "Exactly one stylesheet per package" was asserted by the docblock and by US-01M0GM9N AC1,
  // and counted by nothing - the outcome was held only by check-exports, which AC1 does not run
  // (review R7). The tokens package is the documented exception: tokens.css and themes/dark.css
  // are separately-named subpaths in the closed exports table, which is what a theme file is for.
  const EXPECTED = manifest.name.endsWith('clara-tokens') ? 2 : sheets.length <= 1 ? sheets.length : 1
  if (sheets.length > EXPECTED) {
    problems.push(
      `${manifest.name}: ${sheets.length} stylesheets emitted, expected at most ${EXPECTED} - ` +
        `Clara ships ONE per package (${sheets.map((f) => f.slice(root.length + 1)).join(', ')})`,
    )
  }

  // D0005 / TRD:318 - the cascade layer contract. AGENTS.md: it "cannot be retrofitted - adding it
  // later silently changes specificity for every consumer override in existence", so a stylesheet
  // that ships without it is permanently wrong rather than temporarily incomplete.
  for (const sheet of sheets) {
    const css = readFileSync(sheet, 'utf8')
    const rel = sheet.slice(root.length + 1)
    const declarations = (css.match(/@layer\s+clara\.[^;{]*;/g) ?? [])
    if (declarations.length === 0) {
      problems.push(
        `${manifest.name}: ${rel} declares no cascade layer. Every Clara stylesheet must open with ` +
          `\`${LAYER_DECLARATION}\` (D0005) - it cannot be added after release without changing the ` +
          'resolved style of every consumer override written against it.',
      )
      continue
    }
    if (declarations.length > 1) {
      problems.push(
        `${manifest.name}: ${rel} carries ${declarations.length} layer declarations - the effective ` +
          'order then depends on which the browser sees first',
      )
    }
    if (declarations[0].replace(/\s+/g, ' ') !== LAYER_DECLARATION) {
      problems.push(
        `${manifest.name}: ${rel} declares \`${declarations[0].replace(/\s+/g, ' ')}\` but the contract ` +
          `is \`${LAYER_DECLARATION}\`. The ORDER is the contract: ${LAYER_NAMES.join(' < ')}, and ` +
          'anything unlayered outranks them all.',
      )
    }
    // Rules must live INSIDE a layer, not beside the declaration. Checked by BRACE DEPTH, not by
    // line shape - a first attempt used a line regex and flagged every indented rule inside the
    // layer block, which is the opposite of the defect.
    const after = css
      .slice(css.indexOf(declarations[0]) + declarations[0].length)
      .replace(/\/\*[\s\S]*?\*\//g, '')
    let depth = 0
    let pending = ''
    let topLevelRule = null
    for (const ch of after) {
      if (ch === '{') {
        if (depth === 0 && !/^\s*@layer/.test(pending)) topLevelRule ??= pending.trim().slice(0, 40)
        depth++
        pending = ''
      } else if (ch === '}') {
        depth = Math.max(0, depth - 1)
        pending = ''
      } else if (depth === 0) {
        pending += ch
      }
    }
    if (topLevelRule) {
      problems.push(
        `${manifest.name}: ${rel} has a rule outside any @layer block ("${topLevelRule}...") - an ` +
          'unlayered rule outranks every Clara layer, which inverts the override guarantee',
      )
    }
  }

  // D0001 / PRD:244, repo-wide.
  for (const sheet of sheets) {
    for (const prop of readFileSync(sheet, 'utf8').match(/--[\w-]+\s*:/g) ?? []) {
      const name = prop.replace(/\s*:$/, '')
      if (!name.startsWith('--clara-')) {
        problems.push(
          `${manifest.name}: ${sheet.slice(root.length + 1)} declares ${name}, which is not ` +
            '--clara- prefixed (D0001, PRD:244 - "no exceptions")',
        )
      }
    }
  }
}

if (problems.length) fail('stylesheets', problems)
pass('stylesheets', `${total} stylesheet(s), all layered per D0005, reachable through a closed exports subpath, --clara- prefixed`)
