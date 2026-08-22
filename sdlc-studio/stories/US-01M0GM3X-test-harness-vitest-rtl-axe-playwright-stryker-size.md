# US-01M0GM3X: Test harness: Vitest, RTL, axe, Playwright, Stryker, size-limit

> **Status:** Review
> **Verification depth:** deep
> **Author:** sdlc-studio; agent; v1
> **Plan:** PL-01M0HZ74
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** ./playwright.config.ts, ./.size-limit.json, ./stryker.conf.json, ./vitest.config.ts
> **Points:** 8

## User Story

**As a** Sofia Marchetti
**I want** the full test toolchain wired and running against an empty component set
**So that** every later component story inherits a working harness instead of building one

## Context

### Persona Reference

**Sofia Marchetti** - full-stack developer building internal ERP applications. She has assembled
the same twenty-five components four times and wants the twenty-sixth predictable from the
twenty-fifth.
[Full persona details](../personas/sofia-marchetti.md)

### Background

Every later component story in this project has the same definition of done: unit tests, an axe
assertion, a keyboard pass, a visual baseline, a mutation score. If the harness does not exist,
each of those stories builds a piece of it, badly and differently.

This story is where the harness gets built once. Its difficulty is not the wiring - it is that
there is nothing yet to test. A coverage gate over no source, a mutation score over nothing to
mutate, and a browser suite with no page to load all pass for the wrong reason. D0015 is explicit
that a threshold must be "real rather than aspirational", so each gate here must be observed
FAILING before it counts as wired.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| D0014 | Coverage | 90% statements AND 85% branches, both blocking | AC2. Thresholds are never lowered to fit an empty source set. |
| D0015 | Mutation | Stryker, changed files only, 70% blocking, "real rather than aspirational" | AC3. Config validity is provable now; the SCORE is not. |
| TSD | Time budget | Unit + interaction + axe under 3 minutes, local and CI | The strengthened verifiers must stay cheap; slow suites move to CI before any assertion weakens. |
| TSD | Enforcement | "This document defines no gate without an enforcement point" | Every AC here must test that its gate FIRES, not that its config file contains a string. |
| AGENTS.md + TRD:480 | Budgets | Per-component budgets are JavaScript-only, but the FIXED sheet ceiling is separate | AC4's size-limit config carries a `styles.css <= 15 kB gzipped` budget (TRD:480, PRD:1090) plus JS entry budgets. |
| AGENTS.md | Packaging | `files: ["dist"]`; publishing is a one-way door | No test fixture may reach a tarball. |
| PRD | Security | No runtime env vars or network calls | Test config reads no environment and contacts no service. |

## Acceptance Criteria

### AC1: Unit harness runs

- **Given** the workspace
- **When** I run `pnpm test`
- **Then** Vitest with RTL and jsdom executes and reports coverage for statements and branches
- **Verify:** shell pnpm test:coverage
- **Verified:** yes (2026-08-21)
- **Verification target:** functional

### AC2: Coverage gates are set

- **Given** the config
- **When** coverage falls below 90% statements or 85% branches
- **Then** the run fails (D0014)
- **Verify:** shell node scripts/prove-coverage-gate.mjs
- **Verified:** yes (2026-08-21)
- **Verification target:** functional

### AC3: Mutation gate is configured

- **Given** the Stryker config
- **When** I inspect it
- **Then** the runner discovers tests, the threshold is 70 set to break the build (D0015), and the generated token source is excluded
- **Note:** D0015's "changed files only" scope is NOT in force - `since` is not a Stryker option (the schema has no such key). Recorded rather than implied; see D0034.
- **Verify:** shell node scripts/check-mutation-config.mjs

- **Verified:** yes (2026-08-21)
- **Verification target:** functional

### AC4: Playwright and size-limit run

- **Given** the workspace
- **When** I run the CI-only suites
- **Then** both execute and report
- **Verify:** shell pnpm test:e2e && pnpm size
- **Verified:** yes (2026-08-21)
- **Verification target:** functional

> **Three of the four verifiers were replaced during implementation.** As authored, AC2 ran
> `grep "statements: 90"`, AC3 ran `grep "break: 70"`, and AC4 ran `file playwright.config.ts` -
> each proving a string or a file exists rather than that its gate fires. That is the fourth time
> this pattern has been corrected in this epic (PL-01M0HRA0 AC3, PL-01M0HVR8 AC3, PL-01M0HXNX AC6).
> AC2 now writes a deliberately uncovered module and asserts coverage exits NON-ZERO; AC3 parses
> the config and confirms the installed Stryker accepts it; AC4 actually runs both suites.
>
> **What these gates do and do not prove today.** Coverage reports `100% (0/0)` because both
> packages export `export {}` - the threshold is real and demonstrably able to fail, but the NUMBER
> is vacuous until the first component (US-01M0GM69). The same is true of the mutation score: the
> config is valid and blocking, the score is meaningless over nothing to mutate. Stated here so
> neither is later read as coverage it never had.

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Test harness: Vitest, RTL, axe, Playwright, Stryker, size-limit

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 8 (re-sized from 5 by operator decision, 2026-08-21).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| Coverage reports 100% because no file has an executable statement | Must not count as the gate passing. The gate is proven by adding a genuinely uncovered file and observing a non-zero exit. |
| The axe assertion cannot fail | Must be observed failing against known-bad markup before it is accepted. An a11y assertion that always passes is worse than none, because it is credited as coverage. |
| A test fixture is compiled into a published tarball | Must not happen. Fixtures live outside the build `include`; tarball contents are diffed after the change. |
| Stryker mutates the generated token module | Excluded - `packages/tokens/src/generated` is regenerated every build and gitignored, so a mutation score over it is noise. |
| The local suite exceeds the TSD's 3-minute budget | Move the slowest suite to CI-only. Never lower a coverage or mutation threshold to make the clock (TSD, explicit). |
| Playwright browsers are absent on a clean CI machine | Out of scope here, but must not be silently assumed. Recorded for US-01M0GMKD, which owns CI. |

> **Minimum edge cases:** 8 for API stories, 5 for others - not an API story; 6 recorded.

## Test Scenarios

- [ ] `pnpm test` executes Vitest and reports pass/fail counts
- [ ] A React element renders via RTL under jsdom and is asserted against
- [ ] An axe assertion passes on valid markup
- [ ] The same axe assertion FAILS on markup with a known serious violation
- [ ] Coverage is reported for statements and branches over `packages/*/src`
- [ ] Coverage below 90% statements exits non-zero (proven with a deliberately uncovered file)
- [ ] The Stryker config is accepted by the installed Stryker in a dry run
- [ ] The Stryker config sets changed-file scope and a blocking break threshold of 70
- [ ] Playwright launches a browser, loads a page, and reports a result
- [ ] size-limit executes and reports a budget for JavaScript only
- [ ] No test fixture appears in any package tarball after the change
- [ ] `pnpm check` still passes all five guards

> **Minimum test scenarios:** 10 for API stories, 8 for UI - 12 recorded.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GM9N](US-01M0GM9N-package-builds-vite-library-mode-and-the-tokens.md) | Blocks (satisfied) | A real build for size-limit to measure | Review |
| [US-01M0GMKD](US-01M0GMKD-ci-pipeline-the-fourteen-blocking-gates.md) | Follows | Wires these suites as blocking CI gates; this story only proves they run locally | Draft |
| [US-01M0GM69](US-01M0GM69-button.md) | Follows | The first component - where the coverage and mutation numbers stop being vacuous | Draft |
| [CR-01M0HWDQ](../change-requests/CR-01M0HWDQ-the-css-modules-half-of-the-build-pipeline.md) | Enables | This harness is what will prove the CSS Modules path, via a component test asserting a hashed class name | inbox |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| `vitest`, `@vitest/coverage-*` | Test runner + coverage | To be added |
| `@testing-library/react`, `@testing-library/jest-dom` | Component testing | To be added |
| `jsdom` | DOM environment | To be added |
| `axe-core` (+ a Vitest matcher binding) | Accessibility assertions | To be added - binding choice confirmed at implement time, not from memory |
| `@stryker-mutator/core` | Mutation | To be added |
| `@playwright/test` | Browser suite | To be added |
| `size-limit` | Bundle budgets | To be added |

## Estimation

**Points:** 8 - **re-sized from 5 on 2026-08-21 by operator decision.**
**Complexity:** High. Six tools, three of which need a browser or a separate runner, plus three of
the four AC verifiers rewritten because none tests the property its AC states. Sized against
US-01M0GM9N (5), which wired two build pipelines and was comparable or smaller.

The original 5 was an under-estimate. It was raised as a plan finding rather than actioned
unilaterally, because story points are an operator call and quietly correcting one hides the fact
that the epic's remaining work is larger than the backlog says. The operator took the 8.

At 8 this sits exactly on the split threshold, so it is the largest story this project should
accept without decomposing. If Phase 4 (Playwright + size-limit) runs long, splitting it out is the
pre-agreed relief valve rather than a mid-flight surprise.

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

*Not applicable - this story ships no runtime code and publishes nothing.* Test configuration lives
outside the build `include`, so no tarball content changes. Reversal is `git revert`.

## Open Questions

- [x] **Re-size 5 -> 8, or split Playwright + size-limit?** - **RESOLVED 2026-08-21 by operator:
  re-size to 8, do not split.** Phase 4 remains the relief valve if it runs long.

Settled during planning, recorded so they are not re-litigated:

- Playwright targets a **static fixture page**, not Storybook, because `apps/storybook` is a stub.
  The Storybook-backed suite arrives with the Storybook story.
- The coverage and mutation NUMBERS are vacuous until the first component exists. The gates are
  still wired at D0014/D0015 values and proven able to fail; the thresholds are not softened to
  something an empty source set can earn.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Promoted planning -> full; filled the 8 deferred sections. Plan PL-01M0HZ74 authored: 10 interactions, estimation finding raised, three weak AC verifiers flagged for replacement. |
| 2026-08-21 | operator | Re-sized 5 -> 8 per the estimation finding in PL-01M0HZ74; split declined |
| 2026-08-21 | sdlc-studio | Implemented. Vitest 4 + RTL + jsdom 29 + axe-core, Stryker 9.2, Playwright, size-limit all running. 4/4 ACs verified against verifiers that fire. D0032 (axe binding) and D0033 (Node 20 version pins) recorded; TSD amended. |
| 2026-08-21 | sdlc-studio | First review, REJECT, repaired. B1/B2/B3 coverage prover reads the shipped config and asserts the threshold diagnostic; B4 mutation gate filed as BG-01M0J70K and the guard now says it does not execute; B5 a11y gap register opened; B6/B7 harness typechecked and co-located tests work; B8 CSS budget; B10 AC1 verifier; B11 points. |
| 2026-08-22 | sdlc-studio | Fifth-round REJECT repaired. BG-01M0J70K FIXED (root cause `vitest.related` defaulting to true - the runner's own warning said so). H2: `since` is not a Stryker option, removed and recorded as D0034. H3: co-located keyboard specs now execute (TSD:419). H1: coverage prover exercises the shipped include. |
| 2026-08-22 | sdlc-studio | Sixth-round REJECT repaired. X7: the coverage prover now distinguishes zero-files from zero-statements (three prior attempts conflated them). X8: a NaN mutation score no longer passes. X9: two banner claims that asserted nothing now assert. X18 filed as CR-01M0MBGN. |
