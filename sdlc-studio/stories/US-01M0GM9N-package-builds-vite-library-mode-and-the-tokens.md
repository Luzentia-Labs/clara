# US-01M0GM9N: Package builds: Vite library mode and the tokens pipeline

> **Status:** Review
> **Verification depth:** deep
> **Author:** sdlc-studio; agent; v1
> **Plan:** PL-01M0HVR8
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** @arethetypeswrong/cli, packages/*/vite.config.ts, packages/react, packages/react/dist/index.js, packages/tokens/dist/tokens.css, packages/tokens/style-dictionary.config.js
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** each package to build to ESM and CJS with declarations
**So that** the packages are publishable at all

## Context

### Persona Reference

**Sofia Marchetti** - full-stack developer building internal ERP applications; has assembled the
same twenty-five components four times in three libraries and wants the twenty-sixth to be
predictable from the twenty-fifth.
[Full persona details](../personas/sofia-marchetti.md)

### Background

Sofia cannot evaluate Clara at all until it installs. Every build script in the repository
currently reads `echo "not yet implemented" && exit 1`, so there is no `dist`, no tarball, and
nothing for `publint`, `attw`, `size-limit`, or the consumer-verification apps to run against.

This story is the one that turns three manifests into three publishable packages. It is
deliberately about the pipeline, not the contents: real components and real token values arrive
with their own stories. What it fixes permanently is the *shape* of what gets published, which is
the part that cannot be changed after the first release.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Packaging | Publishing is a one-way door - every reachable subpath is permanent (D0001-D0008) | AC1/AC2 emit only into the subpaths the closed exports table already names; the build adds no new public path |
| Epic | Build | `clara-tokens` is Style Dictionary + `tsc`, never Vite (D0028) | AC2 fails if a Vite build appears in the tokens package |
| TRD S9 g10 | Correctness | `publint` and `attw` fail CI on any error | AC3 is that gate, run for the first time against a real artefact |
| PRD F01 | Public API | Tier 2 tokens are public API; tiers 1 and 3 are not | AC2's `tokens.public.json` carries tier 2 only; `tokens.pairings.json` stays out of `dist` (D0029) |
| AGENTS.md | CSS | One `styles.css` per package; CSS is deliberately not tree-shaken | AC1's "one stylesheet" is asserted by `cssFileName`, not left to a default |
| AGENTS.md | Peers | React is a peer, `^18.2.0 \|\| ^19.0.0` | AC1 fails if React is bundled into `dist` |
| PRD | Performance | Per-component budgets apply to JavaScript only | No budget applies to this story's output; `size-limit` becomes runnable here but is enforced by US-01M0GM3X |
| PRD | Security | No runtime environment variables, no network calls | The build must not read env or fetch; token sources are files on disk |

## Acceptance Criteria

### AC1: react and icons build via Vite

- **Given** the two component packages
- **When** I run the build
- **Then** ESM, CJS, and .d.ts are emitted, and the package's CSS is compiled to exactly one stylesheet
- **Verify:** shell pnpm check:publint && pnpm check:bundled-peers && pnpm check:stylesheets
- **Verified:** yes (2026-08-21)
- **Verification target:** functional

### AC2: tokens builds via Style Dictionary plus tsc

- **Given** the tokens package
- **When** I run the build
- **Then** tokens.css, themes/dark.css, tokens.ts and the JSON manifests are emitted without a Vite build (D0028)
- **Verify:** shell node scripts/check-token-output.mjs
- **Verified:** yes (2026-08-21)
- **Verification target:** functional

### AC3: Declarations are correct

- **Given** the built packages
- **When** I run `attw`
- **Then** types resolve correctly in every module mode with zero errors
- **Verify:** shell pnpm check:attw
- **Verified:** yes (2026-08-21)
- **Verification target:** functional

### AC4: No peer is bundled into a published package

- **Given** the built packages
- **When** I scan every emitted JavaScript file in `dist`
- **Then** no React or ReactDOM build is inlined
- **Verify:** shell node scripts/check-bundled-peers.mjs
- **Verified:** yes (2026-08-21)
- **Verification target:** functional

### AC5: The token output invariants hold

- **Given** the emitted token files
- **When** I inspect them
- **Then** `tokens.pairings.json` is absent from every `dist` (D0029), every custom property is
  `--clara-` prefixed (D0001), `themes/dark.css` is scoped rather than `:root` and overrides tier 2
  only, `tokens.public.json` carries tier 2 only (PRD F01), and no tier 2 token is a raw literal
- **Verify:** shell node scripts/check-token-output.mjs
- **Verified:** yes (2026-08-21)
- **Verification target:** functional

> **AC3's verifier was replaced during implementation.** As authored it ran bare `attw --pack`,
> which exits 1 for every Clara package: attw reports a resolution failure for any non-JavaScript
> subpath, and a CSS file has no type declarations under any profile. The bare form could therefore
> never pass, which would have made a blocking gate permanently red. The replacement carries the
> D0030 configuration - `--profile node16` plus `--exclude-entrypoints` for asset subpaths only,
> never `--ignore-rules`, which would also mask a genuinely broken JavaScript entrypoint.

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Package builds: Vite library mode and the tokens pipeline

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 5 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| A token file references a token that does not exist | Style Dictionary fails the build loudly with the unresolved reference named. It must not emit a CSS variable whose value is the literal `{color.base.foo}`. |
| React resolves into the bundle instead of staying external | The build fails, or the guard catches it. A published package carrying its own React copy breaks every consumer at runtime and cannot be fixed by the consumer. |
| The Vite build emits more than one stylesheet | The build fails the `./styles.css` promise in the closed exports table. `cssCodeSplit` must stay `false` and `cssFileName` must be set explicitly. |
| `dist` contains a file that no exports subpath can reach | Allowed and expected for chunks, but never for a file that looks like public API. `tokens.pairings.json` is written outside `dist` so it cannot be mistaken for one (D0029). |
| A declaration file resolves to ESM shape under the `require` condition | `attw` reports **FalseESM** and AC3 fails. The `require` condition must carry its own `./dist/index.d.cts`. |
| The build succeeds but emits an empty or exportless entry | `publint` and `attw` must still pass. An entry with no exports is valid at this stage of the epic; a *missing* entry is not. |

> **Minimum edge cases:** 8 for API stories, 5 for others - this story is not an API story; 6 recorded.

## Test Scenarios

- [ ] `pnpm --filter @luzentialabs/clara-tokens build` exits 0 and writes `dist/tokens.css`
- [ ] The emitted `dist/tokens.css` contains no unresolved `{...}` reference literal
- [ ] `dist/themes/dark.css`, `dist/tokens.json` and `dist/tokens.public.json` all exist
- [ ] `tokens.pairings.json` is NOT present anywhere under any package's `dist`
- [ ] `pnpm --filter @luzentialabs/clara-react build` emits `index.js`, `index.cjs`, `index.d.ts`, `index.d.cts`
- [ ] `packages/react/dist/styles.css` exists and is the only stylesheet emitted
- [ ] `dist/index.js` for icons and react contains no bundled React (grep for a React internal marker)
- [ ] `npx publint` is clean for all three packages
- [ ] `pnpm check:attw` reports no error, and no false module-shape diagnostic, for all three packages
- [ ] `pnpm check` still passes all four guards after the manifests change

> **Minimum test scenarios:** 10 for API stories, 8 for UI - 10 recorded.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GMPJ](US-01M0GMPJ-pnpm-workspace-and-repository-scaffold.md) | Blocks (satisfied) | The workspace, the three manifests, and the four guard scripts | Done |
| [US-01M0GMFB](US-01M0GMFB-dual-publishing-with-a-closed-exports-map.md) | Overlaps | Its AC4/AC5 assert the `.d.cts` shape this story delivers; they are regression pins here, not undelivered work | Draft |
| [US-01M0GMN0](US-01M0GMN0-f00-foundations-pass-decide-the-visual-language.md) | Supersedes content | The placeholder token values this story ships to make the pipeline runnable are replaced wholesale by F00 | Draft |
| [US-01M0GM16](US-01M0GM16-cascade-layers-and-the-consumer-override-guarantee.md) | Follows | Owns the `@layer` wrapper. This story must not post-process CSS in a way that blocks it. | Draft |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| `style-dictionary` ^4 | Build (tokens) | To be added |
| `vite` ^6 | Build (icons, react) | To be added |
| `vite-plugin-dts` | Build (icons, react) | To be added |
| `typescript` ^5.6 | Build, all three | Currently a phantom dependency - `tsc` is invoked with no manifest entry |
| `publint`, `@arethetypeswrong/cli` | Verification only, via `npx` | Available on demand |

## Estimation

**Points:** 5
**Complexity:** Medium - three build pipelines, two of them sharing one config shape, with no
application logic. The size comes from breadth (three packages, two toolchains, four output
formats each) rather than depth. Sized against US-01M0GMPJ (2), which wrote manifests only and
no build.

> **Points** are a RELATIVE size on the modified Fibonacci scale (1, 2, 3, 5, 8, 13, 20) - not
> "how long will this take" but "is this bigger than that one", sized against stories already
> delivered. The gaps widen deliberately, because uncertainty grows with size: it is much harder
> to argue a story is a 7 rather than an 8 than to choose between a 5 and an 8. A value off the
> scale is REFUSED, never rounded - the scale IS the estimate. Above 8, SPLIT the story;
> estimator consistency collapses beyond it, so a bigger number is a triage failure rather than
> a harder estimate. This is the one size vocabulary: the planner, the forecast and the measured
> velocity all read this field.

## Rollback Envelope

> Required when `affects_production_runtime: true`; optional otherwise. See `reference-story.md#rollback-envelope`.

**Affects production runtime:** false

*Not applicable - nothing is published by this story.* The packages remain at version `0.0.0` and
unpublished, so no consumer can observe this change. Reversal is `git revert`; there is no
released artefact to withdraw and no immutable-release constraint in play yet.

This is the last story in the epic where that is true for the packaging shape: once
US-01M0GMWF publishes, the `exports` map this story finalises becomes permanent.

## Open Questions

None blocking. Two implementation choices are deliberately deferred to implement time and
recorded in `PL-01M0HVR8` rather than here, because either answer satisfies the ACs:

- How `index.d.cts` is emitted (`vite-plugin-dts` hook vs a post-build copy) - Owner: implementer
- Whether `rollupTypes: true` pulls in `@microsoft/api-extractor` - Owner: implementer

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Promoted planning -> full; filled the 8 deferred sections (6 edge cases, 10 test scenarios, 4 story dependencies) to clear the In Progress gate |
| 2026-08-21 | sdlc-studio | REJECT from anton-reis repaired: added `check-bundled-peers` (F1, Critical) and `check-token-output` (F3/F4/F6/F7) as guards and as AC4/AC5; `--clara-` prefix added (D0001); source layout aligned to TRD S6; typecheck fixed on a clean checkout (F8); AC1/AC2 verifiers replaced (F9). Tier 2 family divergence disclosed as CR-01M0J0Z6 (F6). |
| 2026-08-21 | sdlc-studio | Second REJECT repaired: `check-bundled-peers` rewritten to assert import-specifier survival rather than match version-specific strings - React 19 minified now caught (N1); `check-token-output` requires the dark selector rather than denying `:root` (N2), reads the build's own tier manifest rather than a directory path (N3), and asserts the tier 2 set is complete and symmetric (N4); DTCG `$value` refused before any emit (N4b); new `check-stylesheets` guard enforces one-stylesheet and repo-wide `--clara-` (N7, N9); AC1 verifier now counts stylesheets. |
| 2026-08-21 | sdlc-studio | Third REJECT repaired. R1/R2/R3 (Critical x2): `check-bundled-peers` no longer infers externalization - a Rollup plugin records `chunk.modules` and the guard reads it. R4 (High): `tokens.public.lock.json` pins the public surface outside the build. R5/R6/R7/R10 fixed. |
| 2026-08-21 | sdlc-studio | Fourth REJECT repaired. A1 (Critical): the guard no longer selects its mode by filename - every package emits a bundle record and a missing one fails. A2 (High): denylist inverted to an allowlist over package-relative `src/` paths. A3: record resets per build. |
| 2026-08-22 | sdlc-studio | Fifth REJECT repaired. C1 (Critical): the round-4 fix had RELOCATED the filename test into finalize-dual, where it fabricated records - deleted, replaced by an explicit tsc recorder that verifies sources exist. C2: per-chunk sha256 binds every record to the bytes it describes. C3: banners name the package set. |
| 2026-08-22 | sdlc-studio | Sixth REJECT repaired. X1 (Critical): the asserting record writer is deleted - one Rollup-plugin writer remains and tokens observes its graph bound to real artifact hashes. X14: the prover stages `src/`. |
