# CR-01M0MBGN: The guard layer has no tests, no coverage, and no mutation testing

> **Status:** Complete
> **Triage-severity:** High
> **Triaged-by:** Richard Dale Umayan; human; v1
> **Priority:** High
> **Verification depth:** functional
> **Type:** Improvement
> **Size:** M
> **Affects:** vitest.config.ts, stryker.conf.json, scripts/prove-guards-fail.mjs
> **Date:** 2026-08-22
> **Created-by:** sdlc-studio file
> **Raised-by:** sdlc-studio; agent; v1
> **Raised-in-batch:** none open - raised outside a delivery batch

## Summary

13 guards plus wcag.mjs, oklch.mjs, generate-ramps.mjs and the bundle-record writer sit outside every quality surface. `vitest.config.ts` scopes coverage to `packages/*/src`, and `stryker.conf.json` scopes mutation to the same - so `scripts/**` has zero tests, zero coverage and zero mutation score. All SIX Criticals across six review rounds have lived in exactly this code. `prove-guards-fail.mjs` is the only proof it works, and it asserts an exit code plus a `FAIL [` banner - never a specific diagnostic, so a guard failing for the WRONG reason still reads as killed (a reviewer showed mutation #16 pins neither of check-stylesheets' two branches, and #1 and #9 are wrong-reason-capable). Raised by the anton-reis seat in round 6 as X18, ranked last of six only because the Criticals above it were shipping.

## Impact

The code with the worst defect density in the project is the only code no automated quality gate measures. Every round has found a Critical here and every fix has been verified by hand. Until `scripts/**` is inside the coverage and mutation surface, the guards are trusted rather than tested - which is the thing they exist to prevent elsewhere.

## Acceptance Criteria

- [ ] `scripts/**` is inside `coverage.include` and the Stryker mutate globs, with the same D0014 and D0015 thresholds as the packages.
- [ ] `wcag.mjs` and `oklch.mjs` have unit tests against published reference values, since every accessibility and colour claim in the project rests on them.
- [ ] `prove-guards-fail.mjs` asserts the specific diagnostic each mutation should produce, not merely a non-zero exit and a FAIL banner - so a guard that fails for the wrong reason is not counted as killed.
- [ ] Every guard has at least one pinned mutation per independent branch: check-stylesheets' reachability and prefix rules are currently pinned by a single case that either branch satisfies.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-22 | sdlc-studio | Raised |

## Delivery

| AC | Delivered | Evidence |
| --- | --- | --- |
| 1. `scripts/**` inside coverage + mutation at D0014/D0015 thresholds | Yes, for `scripts/lib` | Coverage **90.9% statements / 100% branches** over real tests. Mutation **90.91** with **132 mutants armed**, against the 70 break threshold. |
| 2. `wcag.mjs` and `oklch.mjs` unit-tested against published references | Yes | 22 tests. Black-on-white = 21:1 exactly; `#767676` clears 4.5 and `#777777` does not (the canonical AA boundary); luminance coefficients verified to 4dp; `parseHex` refuses 7 malformed inputs rather than guessing. OKLCH anchors, monotonic lightness, hue dominance, and - deliberately - **the silent clipping behaviour is pinned**, because that is what hid a third of the palette being the wrong colour. |
| 3. The prover asserts the diagnostic, not the exit code | Yes | All 17 cases carry an `expect` regex. A guard that fails through a different branch is now reported as **"killed for the WRONG REASON"** and names what fired instead. |
| 4. Each guard has a pinned mutation per independent branch | Yes | Added *"the only stylesheet made unreachable (count unchanged)"* - it renames the single sheet so reachability fails without changing the count. Deleting the reachability rule now produces **SURVIVED**; before, the count rule fired and it still read as killed. |

**Scope stated honestly.** `scripts/check-*.mjs` and the two executable helpers
(`finalize-dual.mjs`, `bundle-record.mjs`) are excluded from unit coverage: they run top-level and
call `process.exit`, so unit-testing them means asserting on a process. They are proven at the
integration level by `prove-guards-fail.mjs`, which now pins each rule by its own diagnostic. That
is recorded in `vitest.config.ts` rather than hidden behind a lowered threshold.

**Two round-7 findings fixed along the way**, because this CR is their root cause:

- **Y6** - `check-mutation-config` counted FILES; the failure was zero MUTANTS. Two files can
  instrument to zero mutants, score `NaN`, and `NaN >= 70` passes. The mutant count was in the same
  output the guard already read. Now: `5 file(s) -> 132 mutant(s) armed`.
- **Y7** - the coverage prover never read `coverage.exclude`, so a scope proven to resolve could be
  emptied by the sibling key. Now read - and **glob matching is done by `picomatch`**, the matcher
  vitest itself uses. Three prior attempts at this check hand-rolled glob semantics and each got
  them wrong differently; that is what stops it repeating.

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-22 | sdlc-studio | Delivered. Coverage 90.9/100 over the guard library, mutation 90.91 with 132 mutants, 30 tests, prover 17 cases each asserting its own diagnostic. Y6 and Y7 fixed as root-cause work. |
