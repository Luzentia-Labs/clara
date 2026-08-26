/**
 * Token build for @luzentialabs/clara-tokens.
 *
 * Style Dictionary + `tsc`, deliberately not Vite: this package emits no components, so Vite's
 * CSS Modules handling - the reason the other two packages use it - buys nothing here (D0028).
 *
 * Two output roots, and the split is load-bearing:
 *   dist/   -> published. `files: ["dist"]` means everything here ships in the tarball.
 *   build/  -> repo-internal. The contrast gate reads it; consumers never see it.
 *
 * `tokens.pairings.json` goes to build/ for exactly that reason (D0029).
 */
import StyleDictionary from 'style-dictionary'
import { applyCascadeLayer } from '../../scripts/lib/cascade-layer.mjs'
import { formats, transformGroups } from 'style-dictionary/enums'

// TRD Section 6 specifies this layout: src/primitive, src/semantic, src/component.
const SOURCE = ['src/primitive/**/*.json', 'src/semantic/**/*.json', 'src/component/**/*.json']
const DARK_OVERRIDES = ['src/themes/dark.json']
const COMPACT_OVERRIDES = ['src/themes/compact.json']

/** Tier 2 is the public surface (PRD F01). Tier 1 and tier 3 are private. */
// Tier is decided by WHICH FILE a token came from, per the TRD's layout - not by its path prefix.
// It used to be `token.path[0] === 'semantic'`, which was true only while tier 2 tokens happened to
// be nested under a `semantic` key. D0044 renamed them to the TRD's scheme (`color.fg.default`),
// and a prefix test would have silently reclassified every tier 2 token as tier 1 - quietly
// emptying the public manifest that is the whole boundary between public and private (D0007).
// Three tiers, decided by WHICH FILE a token came from, per the TRD's layout. `tier1` used to be
// defined as "not tier 2", which was correct only while there were two tiers - adding the component
// layer would have quietly filed every tier 3 token as a primitive, and the public/private boundary
// is drawn off these sets.
const tierOf = (token) => {
  const path = token.filePath ?? ''
  if (/(^|\/)(semantic|themes)\//.test(path)) return 2
  if (/(^|\/)component\//.test(path)) return 3
  return 1
}
const isTier2 = (token) => tierOf(token) === 2

StyleDictionary.registerFilter({
  name: 'clara/tier2',
  filter: isTier2,
})

/**
 * The pairing table, resolved to the token NAMES the CSS actually emits, so the contrast gate
 * compares what shipped rather than what the source file happened to spell.
 */
StyleDictionary.registerFormat({
  name: 'clara/pairings',
  format: async ({ dictionary }) => {
    const byPath = new Map(dictionary.allTokens.map((t) => [t.path.join('.'), t]))
    const { pairings } = JSON.parse(
      await import('node:fs/promises').then((fs) => fs.readFile('src/pairings.json', 'utf8')),
    )
    const resolved = pairings.map((p) => {
      const fg = byPath.get(p.foreground)
      const bg = byPath.get(p.background)
      if (!fg || !bg) {
        throw new Error(
          `pairings.json references a token that does not exist: ${!fg ? p.foreground : p.background}`,
        )
      }
      return {
        foreground: { token: fg.name, value: fg.value },
        background: { token: bg.name, value: bg.value },
        minRatio: p.minRatio,
      }
    })
    return `${JSON.stringify({ pairings: resolved }, null, 2)}\n`
  },
})

StyleDictionary.registerFormat({
  name: 'clara/tier-manifest',
  format: ({ dictionary }) =>
    JSON.stringify(
      {
        tier2: dictionary.allTokens.filter(isTier2).map((t) => ({ path: t.path.join('.'), name: t.name })),
        tier1: dictionary.allTokens.filter((t) => tierOf(t) === 1).map((t) => ({ path: t.path.join('.'), name: t.name })),
        tier3: dictionary.allTokens.filter((t) => tierOf(t) === 3).map((t) => ({ path: t.path.join('.'), name: t.name })),
      },
      null,
      2,
    ) + '\n',
})

const cssPlatform = (buildPath, destination, { selector, filter } = {}) => ({
  transformGroup: transformGroups.css,
  // PRD:244 and TRD:298 - "Every CSS custom property is prefixed `--clara-` with no exceptions",
  // and D0001 fixes the prefix independent of the npm scope. Set on the CSS platforms only: the
  // TypeScript constants are reached by import and need no namespace of their own.
  prefix: 'clara',
  buildPath,
  files: [
    {
      destination,
      format: formats.cssVariables,
      ...(filter ? { filter } : {}),
      options: { outputReferences: true, ...(selector ? { selector } : {}) },
    },
  ],
})

/**
 * Clara's token sources use the `value` form. A token written in the DTCG `$value` form used to
 * vanish from the output silently while still being declared in the dark theme (review N4); after
 * the tier manifest landed it throws mid-build instead, leaving a partial dist and a stack trace.
 * Refusing up front turns that into one actionable line and emits nothing.
 */
async function rejectDtcgSyntax() {
  const { readdir, readFile } = await import('node:fs/promises')
  const offenders = []
  const scan = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = `${dir}/${entry.name}`
      if (entry.isDirectory()) await scan(full)
      else if (entry.name.endsWith('.json') && /"\$value"\s*:/.test(await readFile(full, 'utf8'))) {
        offenders.push(full)
      }
    }
  }
  await scan('src')
  if (offenders.length) {
    console.error('FAIL [tokens] DTCG "$value" syntax found in:')
    for (const f of offenders) console.error(`  ${f}`)
    console.error('  Clara token sources use the "value" form. Mixing the two drops tokens silently.')
    process.exit(1)
  }
}

async function build() {
  await rejectDtcgSyntax()

  /**
 * A tier may only reference the tier directly beneath it (TRD Section 6, Error severity).
 *
 * Without this the tiers are a naming convention rather than an architecture: a component token
 * reaching straight past the semantic layer into a primitive is exactly how the semantic layer
 * stops being the place a theme is changed, and nothing in the output would look wrong.
 */
function validateTierReferences (dictionary) {
  const tierByPath = new Map(dictionary.allTokens.map((t) => [t.path.join('.'), tierOf(t)]))
  const violations = []
  for (const token of dictionary.allTokens) {
    const tier = tierOf(token)
    if (tier === 1) continue
    const raw = token.original?.value
    if (typeof raw !== 'string') continue
    for (const ref of raw.matchAll(/\{([^}]+)\}/g)) {
      const target = tierByPath.get(ref[1])
      if (target === undefined) {
        violations.push(`${token.path.join('.')} references {${ref[1]}}, which is not a token`)
      } else if (target !== tier - 1) {
        violations.push(
          `${token.path.join('.')} (tier ${tier}) references {${ref[1]}} (tier ${target}) - ` +
            `a tier may only reference tier ${tier - 1}`,
        )
      }
    }
  }
  if (violations.length) {
    console.error('FAIL [tokens] tier reference violations:')
    for (const v of violations) console.error(`  ${v}`)
    process.exit(1)
  }
  return violations
}

// Light theme: CSS, JSON manifests, and the TypeScript source that `tsc` then compiles.
  const light = new StyleDictionary({
    source: SOURCE,
    platforms: {
      css: cssPlatform('dist/', 'tokens.css'),
      // Emitted as `index.ts`, and it IS the package entry - there is no hand-written wrapper
      // re-exporting it. That keeps the compiled output a single module with no internal imports,
      // which is what lets the CJS pass be renamed .js -> .cjs without rewriting any require path.
      ts: {
        transformGroup: transformGroups.js,
        buildPath: 'src/generated/',
        files: [
          /*
           * TIER 2 ONLY - the same filter `tokens.public.json` uses, and for the same reason
           * (BG-01M0XZMJ).
           *
           * This emitted all 322 tokens: tier 1 primitives, tier 2 semantics and tier 3 component
           * values alike, every one of them `@public` in the API report. PRD F01 and AGENTS.md both
           * say only tier 2 is public, and `tokens.public.lock.json` agrees - 65 entries, zero of
           * them tier 1 or 3. So the package's shipped JS surface contradicted its own policy by
           * 257 names.
           *
           * Two guards disagreed as a result: renaming a tier 3 token passed the public-token lock
           * (not in it) and FAILED api-report (a public signature moved). Whoever hit that had to
           * decide which gate was lying, and the cheap way out - regenerate the API report - is
           * exactly the motion that would break a real consumer if the policy were ever enforced.
           *
           * Fixed now rather than later because nothing is published yet. `NPM_TOKEN` is unset, so
           * removing 257 names from the surface costs nobody anything today and would be a breaking
           * change the moment it is not.
           */
          { destination: 'index.ts', format: formats.javascriptEs6, filter: 'clara/tier2' },
        ],
      },
      json: {
        transformGroup: transformGroups.js,
        buildPath: 'dist/',
        files: [
          { destination: 'tokens.json', format: formats.jsonNested },
          { destination: 'tokens.public.json', format: formats.jsonFlat, filter: 'clara/tier2' },
        ],
      },
      // Repo-internal audit trail: the tier the BUILD assigned to every token, so the output
      // guard can check against the build's own predicate rather than re-deriving tier from a
      // directory path. A guard that re-implements the rule it is checking cannot catch the case
      // where the two definitions diverge (review N3).
      manifest: {
        transformGroup: transformGroups.css,
        buildPath: 'build/',
        files: [{ destination: 'tier-manifest.json', format: 'clara/tier-manifest' }],
      },
      // Repo-internal only. Never under dist/ (D0029).
      pairings: {
        transformGroup: transformGroups.css,
        buildPath: 'build/',
        files: [
          { destination: 'tokens.pairings.json', format: 'clara/pairings' },
        ],
      },
    },
  })

  // Dark theme: the same tier 2 names, different tier 1 references.
  // `include` is the base and `source` is the override: that is how Style Dictionary models a
  // theme, and it is why redefining a tier 2 name here is not reported as a collision. Keeping
  // the distinction means a genuine accidental collision still surfaces as a warning.
  // Two things make dark.css correct rather than merely present:
  //
  //   selector  - NOT `:root`. PRD F02 activates a theme via `data-clara-theme` on any ancestor,
  //               so an unscoped `:root` here would clobber tokens.css at equal specificity with
  //               no way back to light. (`prefers-color-scheme` and the portal-scoping half of
  //               F02 belong to US-01M0GM5M; this is only the selector the file must not get
  //               wrong from the start.)
  //   filter    - only the tokens the dark file actually redefines. Tier 1 primitives stay
  //               defined once, in tokens.css, and dark references them through var().
  const dark = new StyleDictionary({
    include: SOURCE,
    source: DARK_OVERRIDES,
    // Suppressed on THIS instance only, never on the light build: filtering out the tier 1
    // references is the design, so Style Dictionary's "filtered out token references were found"
    // warning fires on every build and would train the reader to ignore warnings that matter.
    log: { warnings: 'disabled' },
    platforms: {
      css: cssPlatform('dist/themes/', 'dark.css', {
        selector: '[data-clara-theme="dark"]',
        filter: (token) => token.filePath.endsWith('themes/dark.json'),
      }),
      // The dark theme MUST emit its own pairing table. Without it the contrast gate measured the
      // light build only, and two declared 4.5:1 pairings shipped at 3.23 and 3.35 in
      // dist/themes/dark.css - falsifying D0035 clause 2, PRD F02, and this project's own claim
      // that nothing ships with a failing pairing (review X2).
      pairings: {
        transformGroup: transformGroups.css,
        buildPath: 'build/',
        files: [{ destination: 'tokens.pairings.dark.json', format: 'clara/pairings' }],
      },
    },
  })

  /**
   * Compact density, built exactly like the dark theme and for the same reason.
   *
   * Density is a SCOPED override of the semantic geometry, not a second copy of the token set:
   * the compact file redefines only the spacing and size tokens D0037 fixes, and everything else
   * keeps resolving through the base layer. A density that redefined the whole scale would drift
   * from comfortable the moment either changed.
   *
   * The selector is an attribute, so a subtree can be compact inside a comfortable page - which is
   * what TRD ADR-006's context propagation writes onto a portal root.
   */
  const compact = new StyleDictionary({
    include: SOURCE,
    source: COMPACT_OVERRIDES,
    log: { warnings: 'disabled' },
    platforms: {
      css: cssPlatform('dist/themes/', 'compact.css', {
        selector: '[data-clara-density="compact"]',
        filter: (token) => token.filePath.endsWith('themes/compact.json'),
      }),
    },
  })

  // Validate BEFORE emitting. A build that writes the files and then complains has already put a
  // violating token where something can consume it.
  validateTierReferences(await light.getPlatformTokens('manifest'))
  await light.buildAllPlatforms()
  await dark.buildAllPlatforms()
  await compact.buildAllPlatforms()
}

await build()

// D0005 / TRD:318: every Clara stylesheet is emitted inside the cascade layer. Token CSS is
// `clara.tokens`, which loses to `clara.components` and to anything a consumer writes unlayered.
// Applied after the build because Style Dictionary's css/variables format owns the rule body.
{
  // Walk what was EMITTED rather than a hardcoded list. The list was ['dist/tokens.css',
  // 'dist/themes/dark.css'], so adding compact.css produced an unlayered stylesheet - and the
  // layer contract cannot be retrofitted after release without changing the resolved style of
  // every consumer override already written (D0005). A file this step does not know about is
  // exactly the file that ships wrong.
  const { readFileSync, writeFileSync, readdirSync, statSync, existsSync } = await import('node:fs')
  const walkCss = (dir) => !existsSync(dir) ? []
    : readdirSync(dir).flatMap((e) => {
      const full = `${dir}/${e}`
      return statSync(full).isDirectory() ? walkCss(full) : full.endsWith('.css') ? [full] : []
    })
  const sheets = walkCss('dist')

  /**
   * A theme is not only a set of custom properties.
   *
   * `color-scheme` tells the user agent which livery to paint its OWN controls in, and Clara
   * declared it nowhere - so with `appearance: auto` on checkbox, radio and switch, every
   * UA-painted control in a dark Clara application rendered in LIGHT livery: glyphs, scrollbars,
   * the NumberInput spinners, native pickers, the autofill tint (BG-01M0W799, found by the ux seat
   * while ruling on D0097).
   *
   * BOTH halves are declared. Without `color-scheme: light` on the base, a user agent in dark OS
   * mode paints DARK controls on Clara's light theme - the same defect with the polarity reversed,
   * and fixing one half only would be worse than fixing neither.
   *
   * It goes on the theme's OWN selector, which is why it is injected per file rather than at
   * `:root`: PRD F02 activates a theme via `data-clara-theme` on any ancestor, so a dark
   * `ClaraScope` inside a light page must flip its own subtree's controls too.
   *
   * `compact.css` gets nothing - density is not a colour scheme.
   *
   * A standard property, not a custom one, so the `--clara-` prefix rules in `check-token-output`
   * and `check-stylesheets` do not apply: both match `--*` only. Checked before writing this.
   */
  const COLOR_SCHEME = { 'dist/tokens.css': 'light', 'dist/themes/dark.css': 'dark' }
  for (const [file, scheme] of Object.entries(COLOR_SCHEME)) {
    if (!existsSync(file)) {
      console.error(`FAIL [color-scheme] ${file} was not emitted, so its colour scheme cannot be set`)
      process.exit(1)
    }
    const before = readFileSync(file, 'utf8')
    // First declaration inside the first selector block, beside the tokens it accompanies.
    const after = before.replace(/\{\n/, `{\n  color-scheme: ${scheme};\n`)
    if (after === before || !new RegExp(`color-scheme:\\s*${scheme}`).test(after)) {
      console.error(`FAIL [color-scheme] could not place \`color-scheme: ${scheme}\` in ${file}`)
      process.exit(1)
    }
    writeFileSync(file, after)
  }
  console.log(`PASS [color-scheme] ${Object.keys(COLOR_SCHEME).length} theme stylesheet(s) declare their scheme`)

  /**
   * Re-resolve tier 3 inside every scope (BG-01M0WQY1).
   *
   * A custom property whose value is a `var()` reference is substituted at computed-value time ON
   * THE ELEMENT WHERE IT IS DECLARED, and the resulting literal is what inherits. Declared once at
   * `:root`, `--clara-button-secondary-bg: var(--clara-color-bg-surface)` resolves against the
   * root's LIGHT tier 2, becomes `#ffffff`, and stays `#ffffff` all the way down. A descendant
   * `<ClaraScope theme="dark">` redefines `--clara-color-bg-surface` on itself, which is far too
   * late - the alias was resolved at the root and never looks again.
   *
   * The scope was never the broken part: tier 2 flips correctly in both directions inside it.
   * Everything reaching tier 3 simply did not follow, so a secondary Button in a dark scope
   * rendered white on a dark surface - PRD F02 and TRD ADR-006's headline capability, silently
   * inert. jsdom does not resolve `var()` at all, which is why a full theming suite passed over it.
   *
   * So the referencing aliases are re-declared on the scope roots themselves, where they resolve
   * against that subtree's tier 2. `:root` is deliberately NOT in the selector list - it already
   * carries these declarations from the main block, and repeating them there would be noise.
   *
   * Only the `var()`-referencing aliases move. A tier 3 token holding a literal cannot go stale,
   * and re-declaring it would suggest otherwise.
   */
  const tier3 = JSON.parse(readFileSync('build/tier-manifest.json', 'utf8')).tier3
  const tier3Names = new Set(tier3.map((t) => `--clara-${t.name}`))
  const tokensCss = readFileSync('dist/tokens.css', 'utf8')
  const rescoped = tokensCss.split('\n').filter((line) => {
    const declared = line.match(/^\s*(--clara-[a-z0-9-]+)\s*:/)
    return declared && tier3Names.has(declared[1]) && line.includes('var(--clara-')
  })
  if (!rescoped.length) {
    // The alternative is emitting an empty rule and reporting success, which would restore the
    // exact bug this step exists to prevent while looking like it had been fixed.
    console.error('FAIL [tier3-scope] no referencing tier 3 alias was found in dist/tokens.css - ' +
      'the scope block would be empty and every component would silently freeze at the root again')
    process.exit(1)
  }
  writeFileSync('dist/tokens.css', `${tokensCss}\n[data-clara-theme],\n[data-clara-density] {\n${rescoped.join('\n')}\n}\n`)
  console.log(`PASS [tier3-scope] ${rescoped.length} referencing tier 3 alias(es) re-resolve inside a scope`)

  for (const file of sheets) {
    writeFileSync(file, applyCascadeLayer(readFileSync(file, 'utf8'), 'clara.tokens'))
  }
  if (!sheets.length) {
    console.error('FAIL [layers] no stylesheet was emitted - nothing was wrapped')
    process.exit(1)
  }
  console.log(`PASS [layers] ${sheets.length} token stylesheet(s) wrapped in clara.tokens`)
}
