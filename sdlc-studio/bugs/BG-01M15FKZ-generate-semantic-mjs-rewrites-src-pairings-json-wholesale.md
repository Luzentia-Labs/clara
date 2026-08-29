# BG-01M15FKZ: generate-semantic.mjs rewrites src/pairings.json wholesale and silently destroys the five hand-added tier 3 panel pairings

> **Status:** inbox
> **Severity:** High
> **Points:** 3
> **Affects:** packages/tokens/generate-semantic.mjs, packages/tokens/src/pairings.json, scripts/check-contrast.mjs
> **Created:** 2026-08-29
> **Created-by:** sdlc-studio file
> **Raised-by:** sdlc-studio; agent; v1
> **Raised-in-batch:** none open - raised outside a delivery batch

## Summary

`packages/tokens/generate-semantic.mjs:197` writes `src/pairings.json` in full from its own `pairings()` function. That file also carries FIVE rows the generator does not know about - `popover.fg on popover.bg`, `drawer.fg on drawer.bg`, `tooltip.fg on tooltip.bg`, `toast.fg on toast.bg` and one more - hand-added tier 3 pairings, each with a long `why` explaining that they exist because declaring only the tier 2 ancestors is NOT equivalent for a portalled surface, and that the omission once shipped 1.26:1 text in dark theme.

Running the generator deletes all five. Measured during the D0124 repair: adding one tier 2 pairing to `pairings()` and running the file removed 30 lines and dropped every tier 3 panel row.

What makes this a trap rather than an inconvenience is that the generator is the DOCUMENTED way to add a pairing, and nothing in the file or the script says the file is partly hand-maintained. The same hazard is already recorded one file over: `src/primitive/alpha.json` exists as a separate file precisely because `generate-ramps.mjs` replaces a whole group and 'anything hand-added there is destroyed by the next run'. The lesson was learned for ramps and not applied to pairings.

It was caught here only by a second, independent list: `contrast-required.json` requires those five pairings, so `check:contrast` failed with 'not declared'. That is luck rather than design - the coverage check and the destroyed data happen to overlap. A hand-added row NOT mirrored in `contrast-required.json` would vanish with every gate green.

## Steps to Reproduce

1. `node packages/tokens/generate-semantic.mjs`
2. `git diff --stat packages/tokens/src/pairings.json` - 30 lines removed.
3. `git diff packages/tokens/src/pairings.json | grep '^-'` - the popover, drawer, tooltip and toast tier 3 rows are gone.
4. `pnpm build && node scripts/check-contrast.mjs` - FAIL, 5 required pairings not declared.

## Proposed Fix

Make the file wholly generated, or wholly not. Preferred: move the five tier 3 panel pairings INTO `pairings()` so the generator emits them, which makes `src/pairings.json` a true build artifact and removes the hand-maintenance the file does not advertise. If any row genuinely cannot be generated, move it to a sibling file the generator never writes - the pattern `src/primitive/alpha.json` already establishes for exactly this reason - and have the build concatenate the two. Either way, add a guard asserting that re-running the generator leaves `src/pairings.json` byte-identical: that is the only check that fails on the NEXT hand-added row rather than on this one, and it does not depend on `contrast-required.json` happening to list the same pairs.

## Acceptance Criteria

- [ ] **AC1** The behaviour described is corrected: `packages/tokens/generate-semantic.mjs:197` writes `src/pairings.json` in full from its own `pairings()` function.
- [ ] **AC2** The proposed fix lands, pinned by a test: Make the file wholly generated, or wholly not.

## Impact

Any contributor following the documented path to add a token pairing silently deletes five portalled-panel contrast guarantees. Those five exist because their absence previously shipped 1.26:1 text in dark theme, so the failure mode this restores is a measured, real one rather than a hypothetical.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-29 | sdlc-studio | Filed |
