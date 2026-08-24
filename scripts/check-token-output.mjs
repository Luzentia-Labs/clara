/**
 * Invariants of the emitted token output.
 *
 * Every rule here was claimed by a story or a decision and enforced by nothing. An independent
 * review mutated each one and watched all six guards, publint, attw, and nine acceptance criteria
 * report green (findings F3, F4, F6, F7). A claim with no enforcement point is not a claim.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fail, pass } from './lib/workspace.mjs'

const root = process.cwd()
const tokens = join(root, 'packages/tokens')
const problems = []

/** Skips node_modules: workspace links would report a sibling's dist as this repo's own. */
const walk = (dir) =>
  !existsSync(dir)
    ? []
    : readdirSync(dir).flatMap((n) => {
        if (n === 'node_modules') return []
        const f = join(dir, n)
        return statSync(f).isDirectory() ? walk(f) : [f]
      })

// D0029: the pairing table is build-time input to the contrast gate. Publishing it would make it a
// permanent promise the gate could then never restructure. `buildPath: 'build/'` is the whole
// implementation; a one-word edit puts it in the tarball (review F3).
for (const f of walk(join(root, 'packages'))) {
  if (f.includes('/dist/') && /tokens\.pairings\.json$/.test(f)) {
    problems.push(`D0029: ${f.slice(root.length + 1)} is under dist/ and would ship in the tarball`)
  }
}
if (!existsSync(join(tokens, 'build/tokens.pairings.json'))) {
  problems.push('the pairing table is missing from packages/tokens/build/ - the contrast gate reads it there')
}

const css = join(tokens, 'dist/tokens.css')
const dark = join(tokens, 'dist/themes/dark.css')

if (!existsSync(css) || !existsSync(dark)) {
  fail('token-output', ['tokens.css or themes/dark.css missing - build the tokens package first'])
}

const light = readFileSync(css, 'utf8')
const darkCss = readFileSync(dark, 'utf8')

// PRD:244, TRD:298, D0001 - "--clara- with no exceptions" (review F6).
for (const [name, text] of [['tokens.css', light], ['themes/dark.css', darkCss]]) {
  for (const prop of text.match(/--[\w-]+\s*:/g) ?? []) {
    if (!prop.trim().startsWith('--clara-')) {
      problems.push(`${name}: ${prop.trim().replace(/\s*:$/, '')} is not --clara- prefixed (PRD:244, D0001)`)
    }
  }
}

// PRD F02 activates a theme via `data-clara-theme` on ANY ancestor.
//
// This REQUIRES the correct selector rather than denying `:root`. Denying one wrong selector let
// `:root:root` through - specificity (0,2,0), matches the root element unconditionally, beats
// tokens.css, and forces dark permanently with no way back (review N2). There is exactly one
// right answer here, so assert it directly.
const DARK_SELECTOR = '[data-clara-theme="dark"]'
// Comments are stripped first, then selectors are read between `}` boundaries. The previous form
// was `^`-anchored, so a minified single-line dark.css reduced it to checking only the first
// selector on the line and the two property scans below to no-ops (review R6). Stripping comments
// also stops a selector-shaped string inside a banner from being read as a rule.
// Comments stripped, then the cascade-layer wrapper removed before selectors are read - since
// US-01M0GM16 every sheet opens with `@layer ...;` and wraps its rules in `@layer clara.tokens {`,
// and a parser that does not know that reads the at-rule as a selector.
const withoutComments = darkCss.replace(/\/\*[\s\S]*?\*\//g, '')
const unlayered = withoutComments
  .replace(/@layer\s+clara\.[^;{]*;/g, '')
  .replace(/@layer\s+clara\.[\w.]+\s*\{/g, '')
  .replace(/\}\s*$/, '')
const selectors = unlayered
  .split('}')
  .map((block) => block.split('{')[0].trim())
  .filter((sel) => sel.length > 0 && !sel.startsWith('@'))
const wrong = selectors.filter((sel) => sel !== DARK_SELECTOR)
if (selectors.length === 0) {
  problems.push('themes/dark.css declares no rule at all')
} else if (wrong.length) {
  problems.push(
    `themes/dark.css must use exactly \`${DARK_SELECTOR}\`; found ${wrong.map((w) => `\`${w}\``).join(', ')}. ` +
      'Any other selector that matches the root element overrides the light theme with no way back.',
  )
}

// PRD F01: tokens.public.json IS the public API list.
//
// Tier membership comes from the BUILD's own manifest, not from a directory path and not from a
// name prefix. A reviewer put a `semantic` group inside src/primitive/: it was tier 2 to the build
// and invisible to a path-based guard, so a raw literal reached the public manifest with every
// gate green (N3). Testing for a `Semantic` prefix was equally circular - it restated the filter
// it was checking (N3, second half).
const tierManifestPath = join(tokens, 'build/tier-manifest.json')
if (!existsSync(tierManifestPath)) {
  fail('token-output', ['build/tier-manifest.json missing - run the tokens build first'])
}
const tiers = JSON.parse(readFileSync(tierManifestPath, 'utf8'))
const tier2Names = new Set(tiers.tier2.map((t) => t.name))
const tier1Names = new Set(tiers.tier1.map((t) => t.name))

// themes/dark.css must override tier 2 ONLY; re-declaring tier 1 is the same bug wearing a scoped
// selector. Checked against the tier MANIFEST, not a name prefix: the rule used to be
// `--clara-(?!semantic-)`, which defined "tier 2" as "spelled semantic-", so the moment D0044
// renamed tier 2 to the TRD's scheme all 31 tier 2 overrides read as tier 1 primitives. Third
// place in this build where a hardcoded name prefix stood in for a real tier lookup.
const darkPrimitiveNames = (darkCss.match(/^\s*(--clara-[\w-]+)\s*:/gm) ?? [])
  .map((m) => m.trim().replace(/\s*:$/, '').replace(/^--clara-/, ''))
  .filter((name) => tier1Names.has(name))
if (darkPrimitiveNames.length) {
  problems.push(
    `themes/dark.css re-declares ${darkPrimitiveNames.length} tier 1 primitive(s) ` +
      `(${darkPrimitiveNames.slice(0, 3).join(', ')}); it must override tier 2 semantic tokens ` +
      'only and reference tier 1 through var()',
  )
}

const publicManifest = JSON.parse(readFileSync(join(tokens, 'dist/tokens.public.json'), 'utf8'))
// Style Dictionary's json/flat format keys by the js-transformed name; map back through paths.
// Style Dictionary camel-cases the WHOLE path, collapsing hyphens: `color.neutral-alt.500`
// becomes `ColorNeutralAlt500`. Capitalizing per segment produced `colorNeutral-alt500`, missed,
// and `if (entry && ...)` turned the miss into a silent pass - so any hyphenated segment disabled
// the leak check for that token (review R5).
const camel = (path) =>
  path
    .split('.')
    .flatMap((seg) => seg.split('-'))
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('')
const pathToJs = new Map([...tiers.tier2, ...tiers.tier1].map((t) => [camel(t.path), t]))
for (const key of Object.keys(publicManifest)) {
  const entry = pathToJs.get(key)
  if (!entry) {
    problems.push(
      `tokens.public.json key "${key}" matches no token in the build's tier manifest - the guard ` +
        'cannot classify it, so a tier 1 leak here would go unreported',
    )
  } else if (tier1Names.has(entry.name)) {
    problems.push(
      `tokens.public.json carries "${key}", which the build classified as TIER 1 - PRD F01 makes ` +
        'this file the public API list; tiers 1 and 3 are private',
    )
  }
}

// R4: the public API surface is diffed against a COMMITTED snapshot that the build does not
// write. `tier-manifest.json` is emitted by the same predicate this guard checks against, so it is
// a witness to internal consistency only - narrowing `isTier2` by one clause silently deleted four
// tokens from tokens.public.json with every gate green. Removing a published token is the one
// change npm immutability can never undo, so it needs an oracle outside the build.
const lockPath = join(tokens, 'tokens.public.lock.json')
if (!existsSync(lockPath)) {
  problems.push('tokens.public.lock.json missing - the public token surface has no committed snapshot')
} else {
  const locked = new Set(JSON.parse(readFileSync(lockPath, 'utf8')).keys)
  const current = new Set(Object.keys(publicManifest))
  for (const k of locked) {
    if (!current.has(k)) {
      problems.push(
        `public token "${k}" was REMOVED from tokens.public.json. Tier 2 is public API (PRD F01) ` +
          'and a release is immutable. If this is intended, record a decision and update ' +
          'packages/tokens/tokens.public.lock.json in the same commit.',
      )
    }
  }
  for (const k of current) {
    if (!locked.has(k)) {
      problems.push(
        `public token "${k}" was ADDED to tokens.public.json but is not in the committed snapshot. ` +
          'Every reachable token is a permanent promise - update tokens.public.lock.json deliberately.',
      )
    }
  }
}

// N4: the emitted tier 2 set must be complete. A token that silently vanishes (DTCG `$value`
// syntax did exactly that) or exists only in the dark theme is a public-API change nobody sees.
const emittedLight = new Set(
  (light.match(/--clara-[\w-]+\s*:/g) ?? []).map((m) => m.trim().replace(/^--clara-/, '').replace(/\s*:$/, '')),
)
for (const name of tier2Names) {
  if (!emittedLight.has(name)) {
    problems.push(`tier 2 token "${name}" is in the build manifest but absent from tokens.css`)
  }
}
const emittedDark = new Set(
  (darkCss.match(/--clara-[\w-]+\s*:/g) ?? []).map((m) => m.trim().replace(/^--clara-/, '').replace(/\s*:$/, '')),
)
for (const name of emittedDark) {
  if (!emittedLight.has(name)) {
    problems.push(
      `"--clara-${name}" is declared in themes/dark.css but not in tokens.css - a public token ` +
        'that exists only in dark mode is undefined for every light-mode consumer',
    )
  }
}

// TRD Section 6: "Tier 2 references only tier 1 | Style Dictionary validation | Error".
//
// Driven by the tier 2 PATHS the build itself reported, over every source file - not over one
// directory. Accepts DTCG `$value` as well as `value`, because a token written in the `$value`
// form silently vanished from the output while still being declared in the dark theme (N4).
const tier2Paths = new Set(tiers.tier2.map((t) => t.path))
const tier1Paths = new Set(tiers.tier1.map((t) => t.path))
const sourceFiles = walk(join(tokens, 'src')).filter((f) => f.endsWith('.json'))
for (const f of sourceFiles) {
  const walkTokens = (node, path = []) => {
    if (!node || typeof node !== 'object') return
    const raw = typeof node.value === 'string' ? node.value : typeof node.$value === 'string' ? node.$value : null
    if (raw !== null) {
      if (tier2Paths.has(path.join('.'))) {
        // `[\w.]` excluded the hyphen, and no tier 1 group had ever had one - so the first that
        // did (`color.black-alpha`, the scrim) read as a raw literal while Style Dictionary
        // resolved it perfectly well. Tier 2's OWN paths are full of hyphens (`row-striped`,
        // `accent-emphasis`), so the character was always legal; the regex just never met it.
        const ref = /^\{([\w.-]+)\}$/.exec(raw)
        if (!ref) {
          problems.push(
            `${f.slice(root.length + 1)}: ${path.join('.')} = "${raw}" is a raw literal; ` +
              'tier 2 must reference tier 1 (TRD Section 6)',
          )
        } else if (!tier1Paths.has(ref[1])) {
          // Shape was the only thing checked, so `{color.does-not-exist}` passed here and emitted
          // a var() pointing at nothing. Tier 2 must reference tier 1 - which means the target has
          // to BE a tier 1 token, not merely look like a reference.
          problems.push(
            `${f.slice(root.length + 1)}: ${path.join('.')} = "${raw}" references no tier 1 token; ` +
              'tier 2 must reference tier 1 (TRD Section 6)',
          )
        }
      }
      return
    }
    for (const [k, v] of Object.entries(node)) walkTokens(v, [...path, k])
  }
  walkTokens(JSON.parse(readFileSync(f, 'utf8')))
}

// X11: `design/foundations.md` claims every colour was "generated in OKLCH", but the generator had
// zero importers - the hex was pasted, so the claim was unreproducible and drift was undetectable.
// Assert the committed tier 1 ramps still equal what the generator produces, and that no step is
// clipped (a clipped step is silently NOT the colour the spec requested).
{
  const { generateRamps } = await import('../packages/tokens/generate-ramps.mjs')
  const { ramps, clipped } = generateRamps()
  if (clipped.length) {
    problems.push(
      `${clipped.length} ramp step(s) fall outside the sRGB gamut and are silently clipped, so the ` +
        `shipped colour is not the specified one: ${clipped.slice(0, 3).join(', ')}` +
        (clipped.length > 3 ? ` (+${clipped.length - 3} more)` : ''),
    )
  }
  const committed = JSON.parse(readFileSync(join(tokens, 'src/primitive/base.json'), 'utf8')).color
  for (const [name, steps] of Object.entries(ramps)) {
    for (const [step, hex] of Object.entries(steps)) {
      const have = committed?.[name]?.[step]?.value
      if (have !== hex) {
        problems.push(
          `tier 1 ${name}.${step} is ${have} but the OKLCH spec generates ${hex} - the committed ` +
            'ramps have drifted from their generator (run `pnpm --filter @luzentialabs/clara-tokens generate:ramps`)',
        )
      }
    }
  }
}

if (problems.length) fail('token-output', problems)
pass('token-output', 'pairings unpublished, prefix intact, dark scoped to tier 2, public manifest tier-2 only')
