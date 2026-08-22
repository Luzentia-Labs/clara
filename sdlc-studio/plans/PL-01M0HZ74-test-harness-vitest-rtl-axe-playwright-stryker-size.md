# PL-01M0HZ74: Test harness: Vitest, RTL, axe, Playwright, Stryker, size-limit - Implementation Plan

> **Status:** Complete
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Story:** [US-01M0GM3X](../stories/US-01M0GM3X-test-harness-vitest-rtl-axe-playwright-stryker-size.md)
> **Epic:** [EP-01M0GKNH: Toolchain and release pipeline](../epics/EP-01M0GKNH-toolchain-and-release-pipeline.md)
> **Language:** TypeScript (strict) + test configuration
> **Points:** 8 (re-sized by operator, 2026-08-21)
> **Affects:** vitest.config.ts, playwright.config.ts, stryker.conf.json, .size-limit.json, package.json, packages/react/vitest.setup.ts

## Overview

Wire the six tools the TSD names, so every later component story inherits a working harness rather
than building one. Nothing in this epic after it should start first: it is what makes every
component story verifiable.

The story's own framing is the hard part - "the full test toolchain wired and running **against an
empty component set**". Both packages currently export `export {}`. A coverage gate over no source,
a mutation score over nothing to mutate, and a Playwright suite with no page to load are all
**vacuously satisfiable**, and a gate that passes because there is nothing to check is exactly the
failure D0015 warns about when it says the threshold must be "real rather than aspirational".

This plan's central job is to make each gate provably able to FAIL before declaring it wired.

---

## Specification delta (engagement floor)

| # | Existing requirement it interacts with | Interaction | Resolution |
| --- | --- | --- | --- |
| 1 | **D0014** - 90% statements AND 85% branches, both blocking | With no component source, the only files under `packages/*/src` are two `export {}` entries and the generated token module. A file with no executable statements reports as 100%, so the gate passes for the wrong reason. | Configure the thresholds at D0014's values, then **prove the gate fires** by adding a deliberately uncovered fixture, running coverage, and asserting a non-zero exit. Record explicitly that the number is not yet load-bearing and pin the story where it becomes so. Do NOT lower the threshold to something the empty set "earns". |
| 2 | **D0015** - Stryker over changed files, 70% blocking | Nothing to mutate. A mutation score over an empty change set is meaningless, and `break: 70` in a config file proves only that a string was typed. | Configure per D0015 and prove the config is *valid* via a Stryker dry run. The SCORE becomes real with the first component; say so rather than implying coverage. |
| 3 | **TSD** - "Playwright against built Storybook" | `apps/storybook` is a stub with no build. AC4 says both suites "execute and report". | Playwright runs against a **static fixture page** for this story, proving the runner, browsers, and reporter work. The Storybook-backed suite arrives with the Storybook story. Recorded so a later reader does not think Storybook coverage exists. |
| 4 | **AC2 verifier** `grep "statements: 90" vitest.config.ts` | Proves a string is present, not that coverage blocks. A typo elsewhere, a threshold applied to the wrong scope, or `all: false` would all leave it passing. | **Replace it.** Fourth instance of this class in this epic (PL-01M0HRA0 AC3, PL-01M0HVR8 AC3, PL-01M0HXNX AC6). |
| 5 | **AC3 verifier** `grep "break: 70" stryker.conf.json` | Same defect. | Replace with a check that parses the config and asserts Stryker accepts it. |
| 6 | **AC4 verifier** `file playwright.config.ts` | Proves a file exists; the AC says both suites "execute and report". | Replace with an actual run of both. |
| 7 | **TSD time budget** - unit + interaction + axe under 3 minutes, local and CI | Strengthened verifiers that run coverage, Stryker, Playwright, and size-limit could blow the budget on the AC gate. | Keep the AC-gate verifiers to the cheap proofs. The gate-fires proof for coverage runs on a tiny fixture, not the whole suite. Measure and record actual timings. |
| 8 | **AGENTS.md** - "No `any` in a public API" and strict TS | Test config files are not public API, but `vitest.setup.ts` and any fixture still compile under the strict base config. | Fixtures live under a path the package `tsconfig` excludes from the build, so test types never leak into `dist`. |
| 9 | **US-01M0GM9N** - `packages/*/src` currently exports nothing | Adding a test fixture into `src` would put it in the published tarball via `files: ["dist"]` if it compiles. | Fixtures go in `test/` or `*.test.ts` paths excluded from the build `include`. Verified by re-running `check-license`/`publint` and confirming tarball contents are unchanged. |
| 10 | **CR-01M0HWDQ** - CSS Modules path unproven | The harness is what would prove it, via a component test asserting a hashed class name. | Out of scope here (no components), but the harness must not make it harder. jsdom + CSS Modules handling is configured now so the first component story only writes the test. |

Interactions named: 10. Resolved: 10. Unresolved: 0.

---

## Estimation Finding (raise before starting)

**The story is sized 5. This plan believes it is an 8.**

US-01M0GM9N was a 5 and wired two build pipelines. This story wires **six** tools (Vitest, RTL,
jsdom, axe, Playwright, Stryker, size-limit), three of which need a browser or a separate runner,
and - per interactions 4 to 6 - rewrites three of its four verifiers because none of them currently
tests the property its AC states.

Unlike US-01M0GMFB, where the estimate was left high because work had already been delivered
elsewhere, this is the opposite direction: an under-estimate makes velocity look better than it is
and hides that the epic's remaining work is larger than the backlog says.

**RESOLVED 2026-08-21: the operator re-sized it to 8 and declined the split.**

At 8 the story sits exactly on the split threshold, making it the largest this project should take
without decomposing. Phase 4 (Playwright + size-limit) is the pre-agreed relief valve if the story
runs long - splitting it out then is a planned move rather than a mid-flight surprise.

---

## Technical Context

### What the TSD pins

| Concern | Tool | Threshold |
| --- | --- | --- |
| Unit / interaction | Vitest + React Testing Library | - |
| Accessibility | `axe-core` via `vitest-axe` | zero serious or critical |
| Keyboard / geometry | Playwright | - |
| Mutation | Stryker | 70%, blocking, changed files only |
| Coverage | Vitest | 90% statements, 85% branches, both blocking |
| Size | size-limit | budgets are JavaScript-only (AGENTS.md) |

### Current-API facts, checked against the registry on 2026-08-21

| Package | Current | Last published | Note |
| --- | --- | --- | --- |
| `vitest` / `@vitest/coverage-v8` | 4.1.11 | current | - |
| `jsdom` | 30.0.1 | current | - |
| `@testing-library/react` | 16.3.2 | current | - |
| `@testing-library/jest-dom` | 7.0.1 | current | - |
| `axe-core` | 4.13.0 | 2026-08-20 | actively maintained |
| **`vitest-axe`** | **0.1.0** | **2025-01-22** | **~19 months stale - see the finding below** |
| `jest-axe` | 11.0.0 | 2026-07-26 | maintained |
| `@stryker-mutator/core` | 10.0.0 | current | - |
| `@playwright/test` | 1.62.1 | current | - |
| `size-limit` | 13.0.3 | current | - |

**Finding: the TSD's named axe binding is effectively abandoned.** The TSD specifies
"`axe-core` via `vitest-axe`". `vitest-axe` has been at 0.1.0 since January 2025, declares
`peerDependencies: { vitest: ">=0.16.0" }` with no upper bound (so it "supports" Vitest 4 only by
omission), and pulls in six transitive dependencies - `chalk`, `redent`, `lodash-es`,
`aria-query`, `dom-accessibility-api` - to wrap a library Clara already needs directly.

**Resolution: use `axe-core` directly with a small local matcher.** Anton's non-negotiable is that
every dependency carries a written justification; an unmaintained wrapper contributing six
transitive dependencies over a maintained core does not have one. It also sits in the
accessibility path, which AGENTS.md deliberately splits across two seats (Idris decides, Mira
proves) precisely because a11y coverage is easy to fake - an unmaintained assertion layer there is
the wrong place to save ten lines.

This is a deviation from the TSD and needs a recorded decision plus a TSD amendment at implement
time, not a silent substitution. Risk 1 below is therefore **confirmed, not hypothetical**.

---

## Recommended Approach

**Strategy:** Gate-first, which is stronger than the story's stated Test-After.

For each tool: configure it, then **prove it can fail** before declaring it wired. A gate that has
never been observed failing is indistinguishable from a gate that cannot fail - and the scaffold
review found seven such guards in this very repository (M5, M10, M11, M13, M14, M15, M16 all
SURVIVED). That history is the reason for the emphasis.

---

## Implementation Phases

### Phase 1: Vitest + RTL + jsdom + axe (AC1)

1. Add the unit-test dependencies at the workspace root; confirm current APIs first.
2. `vitest.config.ts` with jsdom, RTL setup, CSS Modules handling (interaction 10), and coverage
   include scoped to `packages/*/src`.
3. One smoke test that renders an element via RTL and runs an axe assertion on it - proving jsdom,
   RTL, and axe are all genuinely wired rather than merely installed.
4. Wire the root `test` script (currently `echo "no tests yet" && exit 0` per package).
5. **Checkpoint:** `pnpm test` runs, reports, and the axe assertion is observed passing AND failing
   (temporarily assert against markup with a known violation, confirm it fails, revert).

### Phase 2: Coverage thresholds that demonstrably block (AC2)

1. Set 90 statements / 85 branches per D0014.
2. Add a temporary uncovered fixture; run coverage; confirm **non-zero exit**. Remove it.
3. Replace AC2's grep verifier with a script performing that add-run-assert-remove cycle.
4. **Checkpoint:** the gate is observed failing, not merely configured.

### Phase 3: Stryker (AC3)

1. `stryker.conf.json` per D0015: changed-file scope, `break: 70`.
2. Dry-run to prove the config is accepted by the installed Stryker.
3. Replace AC3's grep verifier with the config-parse + dry-run check.
4. Record explicitly that the SCORE is not yet meaningful (interaction 2).

### Phase 4: Playwright and size-limit (AC4)

1. `playwright.config.ts` targeting a static fixture page (interaction 3).
2. One trivial spec that loads it and asserts something real.
3. size-limit config with a JavaScript-only budget (AGENTS.md: CSS is deliberately not tree-shaken,
   so no CSS budget).
4. Replace AC4's `file` verifier with an actual run of both.
5. **Checkpoint:** both execute and report; timings recorded against the TSD budget.

### Phase 5: Confirm the packaging work still holds

1. `pnpm check` 5/5; `pnpm build`; `publint`; `attw` - test config must not change tarball contents.
2. Re-verify US-01M0GMPJ, US-01M0GM9N, US-01M0GMFB.
3. Confirm no test fixture reached any `dist` (interaction 9).

---

## Edge Case Handling Plan

| # | Edge case | Handling |
| --- | --- | --- |
| 1 | Coverage passes at 100% because no file has statements | Phase 2 proves the gate fires on a real uncovered file. The vacuity is recorded, not hidden. |
| 2 | A test fixture is published in a tarball | Phase 5 diffs tarball contents; fixtures live outside the build `include`. |
| 3 | The axe assertion cannot fail | Phase 1 observes it failing against known-bad markup before accepting it. |
| 4 | Playwright browsers are absent in CI | Config must not assume a local browser cache; recorded for the CI story (US-01M0GMKD). |
| 5 | The suite exceeds the TSD's 3-minute local budget | Move the slowest suite to CI-only. Never lower a threshold to make the clock (TSD, explicit). |
| 6 | Stryker mutates generated token source | Exclude `packages/tokens/src/generated` - it is regenerated every build and gitignored. |

Story edge cases: 0 recorded on the story (planning-tier). 6 derived here; all handled.

---

## Risks

| # | Risk | Mitigation |
| --- | --- | --- |
| 1 | ~~`vitest-axe` is unmaintained~~ **CONFIRMED** - 0.1.0, stale since 2025-01-22 | Use `axe-core` directly with a local matcher. Record a decision and amend the TSD; do not substitute silently. |
| 2 | Stryker's changed-file scope needs git context CI may not have | Dry-run only in this story; the CI wiring is US-01M0GMKD's problem, flagged there. |
| 3 | Playwright install is heavy and slow | Browsers are a CI concern; keep the local path to Chromium only. |
| 4 | Four new root-level configs make the repo root noisy | Accepted. Every one is named in the TSD; consolidating them is not this story's call. |
| 5 | Strengthened verifiers make the AC gate slow | Interaction 7: keep gate-fires proofs on tiny fixtures. Measure; if the gate exceeds budget, move the proof to CI and record why. |

---

## Definition of Done

- `pnpm test` runs Vitest + RTL + jsdom + axe and reports coverage.
- Every gate has been **observed failing** at least once, with the output recorded here.
- AC2, AC3, AC4 verifiers replaced with ones that test the stated property.
- `pnpm check` 5/5; the three delivered stories still verify.
- The vacuity of the coverage and mutation numbers is recorded, with the story that makes them real.

---

## Implementation Deviations

| # | Plan said | Actual | Why |
| --- | --- | --- | --- |
| 1 | `vitest-axe` confirmed stale; use `axe-core` direct | Done, plus **D0032** and a TSD amendment | The TSD named the tool by name, so substituting silently would have left the document wrong. ~30 lines calling `axe.run` and filtering to serious/critical - the blocking severities the TSD already defines. |
| 2 | Install the toolchain at current versions | **Three tools pinned BELOW latest** - jsdom ^29 (not 30), Stryker ^9.2 (not 10), size-limit ^12 (not 13). **D0033**. | All three shipped a major raising their Node floor above this project's `>=20.19.0`. Each failed loudly on install, so nothing was guessed: jsdom threw `webidl.util.markAsUncloneable is not a function`, Stryker printed an explicit engine guard. Taking latest meant either a broken local run or silently raising Clara's Node floor - a consumer-visible change that belongs in a decision. |
| 3 | (not planned) | `esbuild: { jsx: 'automatic' }` in `vitest.config.ts` | Vitest configures esbuild itself and the root has no tsconfig covering `test/`, so JSX compiled to the classic runtime and every test threw "React is not defined". The same `react-jsx` setting that caused review finding R1. |
| 4 | (not planned) | React added as a workspace-root devDependency | Root-level tests could not resolve `react/jsx-dev-runtime`; React is a devDependency of `packages/react` only. Root-only, so it does not touch any published manifest. |
| 5 | AC2 verifier writes a temp uncovered file | Writes to `.coverage-fixture/`, gitignored, swept on every exit path including signals | Applying review finding N5's lesson directly: the earlier guard-prover wrote to TRACKED files and a SIGINT left a wildcard export on disk. Nothing here is tracked, so an interrupt can leave a stray directory at worst. |
| 6 | Playwright against a static fixture | Done, and the spec asserts **focus identity** rather than mere visibility | The TSD makes focus placement a per-overlay gate; a smoke check that only asserts visibility would have set the wrong precedent for every later keyboard suite. |
| 7 | (not planned) | `check-mutation-config.mjs` added to `pnpm check` | AC3 needed something better than a grep, and a config guard is cheap. `pnpm check` is now 10 guards. |

### Interaction outcomes

All 10 specification interactions carried through. The two that mattered most:

1. **Coverage is vacuous and says so.** `100% (0/0)` on the current source set. The thresholds are
   D0014's values, unsoftened, and `prove-coverage-gate.mjs` demonstrates the gate exits non-zero
   on a genuinely uncovered module. The NUMBER becomes load-bearing with US-01M0GM69.
2. **The axe matcher is proven able to FAIL.** A test asserts it throws on markup with a known
   serious violation. An a11y assertion that cannot fail is worse than none, because it is credited
   as coverage.

### Measured against the TSD time budget

Unit + interaction + axe: **1s** against a 180s budget. Playwright: 1s. Both far inside budget
today and expected to grow with the component set; the TSD's rule stands - move the slowest suite
to CI-only before weakening any assertion.

---

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created via `new` (deterministic) |
| 2026-08-21 | sdlc-studio | Plan authored: 5 phases, 10 interactions resolved, 6 edge cases, 5 risks. Raises an estimation finding (5 -> 8) and flags three weak AC verifiers for replacement. |
| 2026-08-21 | sdlc-studio | Pre-implementation API research: all ten package versions checked against the registry. Risk 1 confirmed real - `vitest-axe` is 19 months stale; resolution is `axe-core` direct, requiring a decision and a TSD amendment. |
| 2026-08-21 | operator | Estimation finding resolved: re-sized 5 -> 8, split declined |
| 2026-08-21 | sdlc-studio | Implemented at 8 points. 5 phases executed, 4/4 ACs verified, 7 deviations recorded, D0032 and D0033 recorded, TSD amended. Three weak verifiers replaced. |
