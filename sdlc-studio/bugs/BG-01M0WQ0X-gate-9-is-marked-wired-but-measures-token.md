# BG-01M0WQ0X: Gate 9 is marked wired but measures token arithmetic, not computed geometry

> **Status:** Fixed
> **Triaged-by:** Claude Opus 5; agent; claude-opus-5
> **Created:** 2026-08-25
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** ci-gates.json, package.json, packages/tokens/src/__tests__/density.test.ts, e2e/geometry.spec.ts
> **Severity:** major
> **Points:** 5

## Summary

CI gate 9 is named "Computed geometry: heights, target size, type floors" and is marked `"status": "wired"` in `ci-gates.json`, running `pnpm check:geometry`. That script runs a single Vitest file, `packages/tokens/src/__tests__/density.test.ts`, which reads token JSON off disk and resolves `{space.3}` references in JavaScript. It renders nothing and calls `getComputedStyle` and `getBoundingClientRect` zero times.

TSD section 7 defines this gate as **Playwright, computed style and bounding box**, blocking every PR, with five assertions on rendered elements: control height 40px comfortable / 32px compact, interactive target >= 24x24px in both densities, body text >= 14px in both densities, and adjacent target spacing in compact per F00.

The gate as wired cannot make any of those five assertions. It asserts the tokens hold the right numbers, which is worth having, but it is a different claim.

## Steps to Reproduce

1. `grep -c "getComputedStyle\|getBoundingClientRect" packages/tokens/src/__tests__/density.test.ts` -> `0`.
2. `grep '"check:geometry"' package.json` -> it runs only that one Vitest file.
3. Read `ci-gates.json` gate 9: `"status": "wired"`.
4. Compare against TSD section 7's assertion table.

\*\*Expected:\*\* a gate named "computed geometry" measures geometry the browser computed. The repo already has `playwright.config.ts`, whose own docblock states the rule: "jsdom cannot compute layout, so anything about real geometry or real focus order belongs in a browser."

\*\*Actual:\*\* the gate resolves token references in Node and compares the numbers to each other.

## Proposed Fix

Split the claim in two rather than deleting either half.

1. Keep `density.test.ts` and rename its gate to what it proves: the token-level density contract. It is real and it is fast.
2. Build the TSD section 7 suite as `e2e/geometry.spec.ts` under the existing `playwright.config.ts`, asserting the five rows against components rendered from the **built** package (`scripts/make-manual-fixture.mjs` already renders built output and is the precedent).
3. Point gate 9 at that suite, and only then mark it wired.

Sequencing note: `pnpm test:e2e` is deliberately outside `pnpm preflight` as a slow-gate exemption, so wiring gate 9 to Playwright either moves it into preflight or makes it a documented CI-only gate. That choice belongs in this bug rather than being assumed here.

## Impact

If `--clara-control-height-comfortable` is 40px but a rendered Button computes to 36px because of a `box-sizing`, `padding` or flex bug, gate 9 stays green. That failure mode is not hypothetical here: the Modal review found a `box-sizing` overflow and a flex squash at 18px, and neither would have been caught by token arithmetic. Twelve more components are about to be built against this gate.

Root cause: the gate was wired to the closest existing test rather than to the capability its name and the TSD describe. `density.test.ts` legitimately covers the *token* half of the density contract, so it passes and reads as coverage. TSD section 6 states the distinction that the wiring lost - a correctness claim needs a computed assertion, and this gate makes a correctness claim about rendered output. Same shape as D0096, applied to geometry rather than CSS text.

## Acceptance Criteria

Derived from TSD section 7's assertion table. Every row is measured on an element the browser
laid out, from the **built** package - not on token JSON, and not on a hand-written copy of a
component's markup.

- **AC1** - Gate 9 runs a browser suite that asserts all five TSD section 7 rows against rendered
  elements, and fails when a rendered control's box disagrees with its token.
- **Verify:** shell pnpm check:geometry
- **Verified:** yes (2026-08-25)

- **AC2** - The token-level density contract survives as its own gate under a name that states what
  it proves, still running in `pnpm preflight` where it is fast and needs no browser.
- **Verify:** shell pnpm check:density-tokens
- **Verified:** yes (2026-08-25)

- **AC3** - The manifest stays honest: every gate's command runs in `ci.yml` and blocks, preflight
  mirrors CI or carries a written exemption, and the browser gate is exempted with its reason.
- **Verify:** shell pnpm check:ci-gates
- **Verified:** yes (2026-08-25)

- **AC4** - The fixture renders from `packages/react/dist`, so the gate measures the artifact
  consumers install. A missing build fails loudly rather than silently measuring nothing.
- **Verify:** shell node scripts/prove-geometry-gate.mjs
- **Verified:** yes (2026-08-25)

## Notes

**A story already claimed this.** `US-01M0GMC6` - *"Density modes with computed geometry
assertions"* - is marked **Done**. It delivered `density.test.ts`, which is token arithmetic. The
title says computed geometry; the artifact is a JSON resolver. This is why the bug is filed against
the gate rather than reopened on the story: the token work is real and should stay Done, and the
rendered assertions are new work that was never done under that title.

`design/foundations.md` line 238 states the intent plainly - the 4px adjacent-target floor is
"not permanent at publish, and US-01M0GMC6 will exercise it against real components." It was never
exercised against a real component. `ButtonGroup` consumes `--clara-space-adjacent-target` as its
flex gap, so the assertion has a real subject.

**Adjacent finding, not fixed here.** Gate 6, *"Keyboard interaction suite, incl. focus-identity
assertions"*, runs `pnpm check:keyboard`, which is Vitest in jsdom. jsdom does track
`document.activeElement`, so focus *identity* is genuinely testable there; what it cannot do is
sequential focus navigation, which `userEvent.tab()` simulates with its own heuristic rather than
the browser's. That is a narrower gap than this bug's and is left for separate triage rather than
widened into it.

## Verification

**Verified by:** Claude Opus 5 (agent)

**Verification date:** 2026-08-25

**Verification depth:** functional

Gate 9 now runs `e2e/geometry.spec.ts` in Chromium against the built package and asserts all five TSD Section 7 rows. Observed failing on the code as it stood (8 control heights wrong) and passing after the fixes. `check-ci-gates` confirms the command runs and blocks in both `ci.yml` and `release.yml`; `scripts/prove-geometry-gate.mjs` confirms a missing build fails loudly rather than measuring an empty page.

**Not yet adversarially reviewed.** This records that the fix was observed working, not that a second seat has signed it off - the author never records their own review. It stays at Fixed until that lands.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-25 | sdlc-studio | Created via `new` (deterministic) |
