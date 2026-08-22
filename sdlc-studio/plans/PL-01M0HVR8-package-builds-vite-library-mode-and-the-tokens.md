# PL-01M0HVR8: Package builds: Vite library mode and the tokens pipeline - Implementation Plan

> **Status:** Complete
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Story:** [US-01M0GM9N](../stories/US-01M0GM9N-package-builds-vite-library-mode-and-the-tokens.md)
> **Epic:** [EP-01M0GKNH: Toolchain and release pipeline](../epics/EP-01M0GKNH-toolchain-and-release-pipeline.md)
> **Language:** TypeScript (strict) + build configuration
> **Points:** 5
> **Affects:** packages/tokens/style-dictionary.config.js, packages/icons/vite.config.ts, packages/react/vite.config.ts, packages/tokens/package.json, packages/icons/package.json, packages/react/package.json

## Overview

Give all three packages a real build. `clara-icons` and `clara-react` build through Vite library
mode with `vite-plugin-dts` (ADR-007); `clara-tokens` builds through Style Dictionary plus `tsc`,
deliberately not Vite, because it emits no components and so gains nothing from Vite's CSS Modules
handling (D0028).

Every `build` script in the repository currently reads `echo "not yet implemented" && exit 1`. This
story replaces all three. It is the first story in the epic that produces a `dist`, which makes it
the story that first makes `publint`, `attw`, `size-limit` and the consumer-verification apps
runnable at all. Nothing downstream in this epic can be verified until it lands.

## Acceptance Criteria Summary

| AC | Name | Verifier | Runnable today |
| --- | --- | --- | --- |
| AC1 | react and icons build via Vite | `file packages/react/dist/index.js` | no - no dist |
| AC2 | tokens builds via Style Dictionary plus tsc | `file packages/tokens/dist/tokens.css` | no - no dist |
| AC3 | Declarations are correct | `shell npx --yes @arethetypeswrong/cli --pack packages/react` | no - no dist |

All three verifiers fail today, which is correct: they are the failing tests this story makes pass.

---

## Specification delta (engagement floor)

This change touches six source files, so per AGENTS.md the interactions are named and resolved
before any code is written.

| # | Existing requirement it interacts with | Interaction | Resolution |
| --- | --- | --- | --- |
| 1 | **US-01M0GMFB AC4** - the `require` condition must declare `./dist/index.d.cts` | US-01M0GM9N AC3 runs `attw`, which reads the manifest. AC3 cannot pass while the `.` export serves one `.d.ts` to both conditions (BG-01M0HTRM). | **This story delivers both halves**: the build emits `index.d.cts`, and the same phase sets `require.types` in all three manifests. US-01M0GMFB AC4/AC5 then stand as permanent regression pins on the story that owns the exports map, not as undelivered work. Recorded so the two stories are not read as duplicating each other. |
| 2 | **TRD Section 5 closed exports table** - `clara-tokens` publishes `./tokens.json`, `./tokens.public.json`, and NOT `tokens.pairings.json` (D0029) | The Style Dictionary build decides which JSON files land in `dist`. Emitting `tokens.pairings.json` into `dist` would not publish it (the exports map is closed), but it would ship it in the tarball via `files: ["dist"]`. | The pairings manifest is written **outside `dist`**, to `packages/tokens/build/`, so it is repo-internal build output that the contrast gate reads and the tarball never carries. `build/` is added to `.gitignore`. |
| 3 | **CR-01M0HT8N / US-01M0GMFB AC6** - each tarball must carry LICENSE | `files: ["dist"]` excludes a package-root LICENSE, and this story is the first to produce a tarball worth packing. | Out of scope here; AC6 lives in US-01M0GMFB. This plan does **not** touch `files`. Noted so the omission is deliberate rather than forgotten. |
| 4 | **AGENTS.md** - "CSS is deliberately not tree-shaken. One `styles.css` per package." | Vite's `build.cssCodeSplit` defaults to `false` in library mode, which already produces one stylesheet; but the emitted filename defaults from the package name, not `styles.css`. | Set `build.lib.cssFileName: 'styles'` explicitly (Vite 6+), so the output is `dist/styles.css` and matches the `./styles.css` subpath the closed exports table already promises. Explicit, not inherited from a default that could change. |
| 5 | **AGENTS.md** - "Cascade layers are load-bearing... All Clara CSS emits inside `@layer clara.reset, clara.tokens, clara.components;`" | This story creates the first CSS output. If the layer wrapper is not present from the first emitted stylesheet, it can never be retrofitted without silently changing specificity for every consumer override. | Out of scope for the *mechanism* (US-01M0GM16 owns the layer guarantee), but the build must not make it impossible. Phase 2 leaves a single documented insertion point for the layer wrapper and **does not** post-process CSS, so US-01M0GM16 can add it without rewriting this pipeline. |
| 6 | **TRD Section 9 gate 10** - `publint` and `attw` fail CI on any error | The gate exists but has never run against a real artefact. | Phases 1-3 are ordered so `attw` is runnable at the end of Phase 3, before the story claims Done. |
| 7 | **peerDependencies: react ^18.2.0 \|\| ^19.0.0** | A library build that bundles React would break every consumer. | `rollupOptions.external` must externalize `react`, `react-dom`, `react/jsx-runtime`, and both workspace siblings. Phase 2 asserts this rather than assuming Vite infers it. |

Interactions named: 7. Resolved: 7. Unresolved: 0.

---

## Technical Context

### Language and framework

- **TypeScript** 5.6+, strict, inherited from `tsconfig.base.json`
- **Build:** Vite library mode 6.x for `icons` and `react` (ADR-007, TRD:157)
- **Declarations:** `vite-plugin-dts` (TRD:158)
- **Tokens:** Style Dictionary 4.x plus `tsc` (D0028, TRD:426)
- **Node:** 20.19+, per the root `engines` field

### Current-API facts checked against the docs (not memory)

- Vite 6 `build.lib` accepts `{ entry, name?, formats?, fileName?, cssFileName? }`. Default
  `formats` is `['es','umd']`, or `['es','cjs']` when multiple entries are used - so `formats`
  must be **stated explicitly** as `['es','cjs']` rather than relied upon.
- `build.cssCodeSplit` **defaults to `false` when `build.lib` is set**, which is what gives one
  stylesheet per package. `cssFileName` names it.
- Style Dictionary 4 uses `new StyleDictionary(config)` + `await sd.buildAllPlatforms()`, with
  built-in formats `css/variables` and `javascript/es6`, and `registerFormat` for custom output.
  The v3 `StyleDictionary.extend()` call is **not** the v4 API.

### Existing patterns

The scaffold (US-01M0GMPJ) established: manifests with a closed `exports` map, `type: "module"`,
`files: ["dist"]`, `sideEffects` set per package, and four guard scripts under `scripts/`. This
story adds build config only; it does not change the manifest shape except for the `require.types`
condition named in interaction 1.

---

## Recommended Approach

**Strategy:** Test-after (D0024 - no keyboard interaction table).

**Rationale:** the acceptance criteria are facts about emitted artefacts, so the honest test is
running the build and inspecting `dist`. There is no unit under test to drive from a failing
assertion. The three AC verifiers already fail today and are the regression pins.

**Sequencing rationale:** tokens first, because `icons` and `react` both depend on it at the
workspace level, and a broken tokens build would make every downstream failure ambiguous.

---

## Implementation Phases

### Phase 1: `clara-tokens` - Style Dictionary plus tsc (AC2)

1. Add `style-dictionary@^4` and `typescript` as devDependencies of `packages/tokens`.
   (`typescript` is currently a phantom dependency - three `typecheck` scripts invoke `tsc` with no
   `typescript` in any manifest or the lockfile. Fixing it for this package here is in scope
   because Phase 1 depends on `tsc`; the other two are picked up in Phases 2-3.)
2. Create `packages/tokens/style-dictionary.config.js` using the v4 constructor API, with platforms:
   - `css` -> `dist/tokens.css` via `css/variables`
   - `css-dark` -> `dist/themes/dark.css`
   - `ts` -> `src/generated/tokens.ts` via `javascript/es6`, then compiled by `tsc`
   - `json` -> `dist/tokens.json` and `dist/tokens.public.json`
   - `pairings` -> **`build/tokens.pairings.json`**, outside `dist` (interaction 2)
3. Wire `"build": "node style-dictionary.config.js && tsc -p tsconfig.json"`.
4. Add `packages/tokens/build/` to `.gitignore`.
5. **Checkpoint:** `pnpm --filter @luzentialabs/clara-tokens build` emits `dist/tokens.css`. AC2's
   verifier passes.

### Phase 2: `clara-icons` and `clara-react` - Vite library mode (AC1)

1. Add `vite@^6`, `vite-plugin-dts`, `typescript`, and (for icons) `@svgr/rollup` as devDependencies.
2. Create `packages/icons/vite.config.ts` and `packages/react/vite.config.ts` with:
   - `build.lib`: `entry: 'src/index.ts'`, `formats: ['es','cjs']` (explicit, interaction 4),
     `fileName: (format) => format === 'es' ? 'index.js' : 'index.cjs'`,
     `cssFileName: 'styles'`
   - `rollupOptions.external`: `react`, `react-dom`, `react/jsx-runtime`,
     `@luzentialabs/clara-tokens`, `@luzentialabs/clara-icons` (interaction 7)
   - `dts({ rollupTypes: true })` for a single declaration entry
   - **no** CSS post-processing step (interaction 5)
3. Add a minimal `src/index.ts` to each package so the build has an entry. This story owns the
   pipeline, not the components; the entry stays minimal and real components arrive with their own
   stories.
4. **Checkpoint:** both packages emit `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`, and
   `packages/react` emits `dist/styles.css`. AC1's verifier passes.

### Phase 3: Declarations that resolve in both module modes (AC3, and BG-01M0HTRM)

1. Emit `dist/index.d.cts` alongside `dist/index.d.ts` for all three packages. **Open choice,
   settle at implement time:** either a `vite-plugin-dts` `afterBuild` hook that copies the rolled
   declaration, or a small post-build `node` copy step in the `build` script. The declaration
   content is identical - only the filename and the manifest condition differ. Prefer whichever
   needs no new dependency.
2. Set `exports['.'].require` to `{ "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }`
   in all three manifests (interaction 1), keeping `import` on `./dist/index.d.ts`.
3. **Checkpoint:** `npx attw --pack packages/react` (and `icons`, `tokens`) exits 0 with no
   `FalseCJS`. AC3's verifier passes, and US-01M0GMFB AC4/AC5 pass as regression pins.

### Phase 4: Wire the root build and confirm nothing regressed

1. `pnpm build` at the root builds all three in dependency order.
2. Re-run `pnpm check` - all four guards must still pass. `check-exports` in particular must still
   report the maps closed after the `require` condition is restructured into an object.
3. Run `npx publint` on each package.
4. **Checkpoint:** `python3 <skill>/scripts/verify_ac.py --story US-01M0GM9N` reports 3/3.

---

## Edge Case Handling Plan

The story records no "Edge Cases & Error Handling" section, so there are zero story edge cases to
map. The build-specific hazards below are carried as risks rather than being invented as edge
cases the story does not claim.

Story edge cases: 0. Handled in plan: 0. Unhandled: 0.

---

## Risks

| # | Risk | Why it matters here | Mitigation |
| --- | --- | --- | --- |
| 1 | `vite-plugin-dts` has no first-class `.d.cts` output | Phase 3 is the whole point of BG-01M0HTRM; if the plugin cannot do it, the phase needs the copy-step fallback | Phase 3 step 1 names both routes and commits to neither until implement time. Not a blocker either way. |
| 2 | `rollupTypes: true` requires `@microsoft/api-extractor` as a peer | Adds an unplanned dependency mid-phase | If it does, drop `rollupTypes` and emit per-file declarations; the exports map is closed, so multiple `.d.ts` files are not a public-surface risk |
| 3 | Externalizing by exact string misses subpath imports (`react/jsx-runtime`) | A bundled React in a published package is a one-way-door defect | External list is written as regex-or-exact covering subpaths, and Phase 4 greps `dist/index.js` for a bundled React as a manual spot-check |
| 4 | TRD pins Vite "5.x/6.x"; current Vite is 7.x | Installing `vite@^6` is deliberate, not stale | Follow the TRD. If a Vite 7 bump is wanted, that is a CR against ADR-007, not a silent choice inside this story |
| 5 | Style Dictionary 4 changed the config API from v3 | A v3-shaped config fails at run time | The v4 constructor form is checked against current docs and recorded above under Current-API facts |

---

## Definition of Done

- All three `build` scripts run and emit to `dist`.
- `verify_ac.py --story US-01M0GM9N` reports 3/3 verified, 0 stale.
- `pnpm check` still passes all four guards.
- `publint` and `attw` are clean on all three packages.
- The `.d.cts` route chosen in Phase 3 is recorded in `decisions.md` if it constrains later
  packaging work; otherwise it is a plan detail and stays here.
- Paperwork ships in the same commit as the code (AGENTS.md).

---

## Implementation Deviations

What the plan said, what was actually done, and why. Recorded because a plan that quietly
disagrees with the code it produced is worse than no plan.

| # | Plan said | Actual | Why |
| --- | --- | --- | --- |
| 1 | Add `@svgr/rollup` to icons | Not added | Speculative. Icons have no SVG sources yet and the icon pipeline is US-01M0GMYZ. "Nothing speculative" (AGENTS.md). |
| 2 | `dts({ rollupTypes: true })` | `dts({ insertTypesEntry: true })` | Two facts found at implement time. The option is now called `bundleTypes` (vite-plugin-dts 5 delegates to unplugin-dts), and it does require `@microsoft/api-extractor` - risk 2 was real. The plan's own mitigation was applied: per-file declarations, safe because the exports map is closed. |
| 3 | Phase 3 emits `.d.cts` via a plugin hook or a copy step | A shared `scripts/lib/finalize-dual.mjs` copy step | No new dependency, and all three packages need the same thing. It also does the tokens CJS rename, so one script covers both jobs. |
| 4 | Tokens: `src/index.ts` re-exports `src/generated/tokens.ts` | Style Dictionary emits `src/generated/index.ts`, which IS the entry | The re-export produced an internal import, so the CJS pass emitted a nested directory and renaming `.js` -> `.cjs` would have broken the `require` path. A single flat module removes the problem instead of papering over it. `finalize-dual.mjs` now fails loudly if a nested CJS output ever reappears. |
| 5 | Phase 2: react gets a CSS Module | react gets a PLAIN `src/styles.css` | A CSS Module with no consuming component is removed by Vite and emits nothing - verified three ways. `./styles.css` is a promised subpath, so something had to emit. Filed as **CR-01M0HWDQ** rather than claimed. |
| 6 | (not planned) | Dark theme scoped to `[data-clara-theme="dark"]`, filtered to overrides only | As first emitted, `dark.css` used `:root` and re-declared every token, so loading it clobbered `tokens.css` at equal specificity with no way back to light. Present-but-wrong is worse than absent. |
| 7 | (not planned) | `--profile node16 --exclude-entrypoints` on attw, recorded as **D0030** | Bare `attw` exits 1 for every Clara package because CSS subpaths have no declarations. AC3's authored verifier could never pass; it was replaced, and the reasoning is pinned in the story. |
| 8 | (not planned) | `engines.node` added to all three manifests | publint flagged it. Free now, a breaking change after first publish. |
| 9 | (not planned) | `_comment` keys removed from token JSON | Style Dictionary parses every key as a token, so the comments became colliding tokens. Provenance moved to `packages/tokens/src/README.md`. |

### Interaction outcomes

All 7 specification interactions from the delta above were carried through:

1. **Delivered both halves** - `.d.cts` is emitted and all three manifests declare `require.types`. BG-01M0HTRM's fix is live; US-01M0GMFB AC4/AC5 now pass as regression pins.
2. **Honoured** - `tokens.pairings.json` is written to `packages/tokens/build/`, verified absent from every `dist`.
3. **Left alone** - `files` untouched; LICENSE stays US-01M0GMFB AC6.
4. **Honoured** - `cssFileName: 'styles'` set explicitly; exactly one stylesheet per package.
5. **Honoured** - no CSS post-processing; no `@layer` wrapper added. US-01M0GM16 is unblocked.
6. **Honoured** - publint clean and attw exit 0 on all three.
7. **Honoured** - external written as regex covering subpaths; no React internals in any `dist`.

---

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created via `new` (deterministic) |
| 2026-08-21 | sdlc-studio | Plan authored: 4 phases, 7 specification interactions resolved, 5 risks. Absorbs delivery of BG-01M0HTRM's fix (interaction 1) and honours D0029 (interaction 2). |
| 2026-08-21 | sdlc-studio | Implemented. 4 phases executed, 3/3 ACs verified by the runner, 9 deviations recorded, D0030 recorded, CR-01M0HWDQ filed for the CSS Modules coverage gap. |
