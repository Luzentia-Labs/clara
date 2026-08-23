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
const SOURCE = ['src/primitive/**/*.json', 'src/semantic/**/*.json']
const DARK_OVERRIDES = ['src/themes/dark.json']

/** Tier 2 is the public surface (PRD F01). Tier 1 and tier 3 are private. */
// Tier is decided by WHICH FILE a token came from, per the TRD's layout - not by its path prefix.
// It used to be `token.path[0] === 'semantic'`, which was true only while tier 2 tokens happened to
// be nested under a `semantic` key. D0044 renamed them to the TRD's scheme (`color.fg.default`),
// and a prefix test would have silently reclassified every tier 2 token as tier 1 - quietly
// emptying the public manifest that is the whole boundary between public and private (D0007).
const isTier2 = (token) => /(^|\/)(semantic|themes)\//.test(token.filePath ?? '')

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
        tier1: dictionary.allTokens.filter((t) => !isTier2(t)).map((t) => ({ path: t.path.join('.'), name: t.name })),
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
          { destination: 'index.ts', format: formats.javascriptEs6 },
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

  await light.buildAllPlatforms()
  await dark.buildAllPlatforms()
}

await build()

// D0005 / TRD:318: every Clara stylesheet is emitted inside the cascade layer. Token CSS is
// `clara.tokens`, which loses to `clara.components` and to anything a consumer writes unlayered.
// Applied after the build because Style Dictionary's css/variables format owns the rule body.
{
  const { readFileSync, writeFileSync, existsSync } = await import('node:fs')
  for (const file of ['dist/tokens.css', 'dist/themes/dark.css']) {
    if (!existsSync(file)) continue
    writeFileSync(file, applyCascadeLayer(readFileSync(file, 'utf8'), 'clara.tokens'))
  }
  console.log('PASS [layers] token stylesheets wrapped in clara.tokens')
}
