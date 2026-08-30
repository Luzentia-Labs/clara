# BG-01M19411: The barrel-entry size budget is a flat per-component allowance, and it has drifted twice in one sprint because components are not interchangeable in size

> **Status:** inbox
> **Severity:** Medium
> **Points:** 3
> **Affects:** scripts/sync-size-budgets.mjs, .size-limit.json
> **Created:** 2026-08-30
> **Created-by:** sdlc-studio file
> **Raised-by:** sdlc-studio; agent; v1
> **Raised-in-batch:** none open - raised outside a delivery batch

## Summary

`ENTRY_BYTES_PER_COMPONENT` in `scripts/sync-size-budgets.mjs` sets the package entry's ceiling as `componentCount x N bytes`, floored at 5000 B. N has moved twice in a single sprint:

- 300 B held through 41 components.
- DatePicker took the measured average to 317.6 B, so N went to 325.
- DateRangePicker took it to 333.3 B, so N went to 350.

The second raise was recorded with the reasoning that a ceiling set AT the current measurement passes today and fails on the next component. It then failed on the very next component. That is the clearest evidence available that the model is wrong rather than the number.

The assumption a flat allowance makes is that components are roughly interchangeable in size. Measured, this library's client chunks run from 525 B (Tag) to several kB (the date pickers), so whenever the recent additions are heavier than the mean the average climbs and the ceiling has to chase it. A budget that is raised every time it fires stops being a budget - it becomes a record of what happened, which is the failure the third-party entries in the same file were split apart to avoid.

What the budget is FOR is catching unintended growth in the barrel. It currently cannot distinguish 'two substantial new components were added deliberately' from 'something started pulling in code it should not', because both look like the average moving.

## Steps to Reproduce

1. `pnpm size` on a tree with 43 components: the ESM entry reports 14334 B against a 13975 B limit.
2. `git log -S ENTRY_BYTES_PER_COMPONENT -- scripts/sync-size-budgets.mjs` shows two raises on the same day.
3. Compare the per-component chunk budgets in the same file: they range from 525 B actual to several kB, against a uniform 5 kB ceiling.

## Proposed Fix

Replace the flat multiplier with something that tracks what the entry is actually made of. Options worth measuring before choosing:

- A ceiling derived from the SUM of the per-component chunk budgets' actuals plus a fixed barrel overhead, so a heavy component raises the ceiling by its own weight rather than by the average.
- A growth-rate check instead of an absolute: fail when the entry grows more than X% in one commit, which is what 'unintended growth' actually means and does not need re-authoring per component.
- Keep the flat figure but make the raise a deliberate, recorded act rather than something `size:sync` can write silently - it is currently a constant in a script, and changing it looks identical in review to changing a comment.

Whichever is chosen, the guard should be able to tell a deliberate addition from an accidental one. It currently cannot.

## Acceptance Criteria

- [ ] **AC1** The behaviour described is corrected: `ENTRY_BYTES_PER_COMPONENT` in `scripts/sync-size-budgets.mjs` sets the package entry's ceiling as `componentCount x N bytes`, floored at 5000 B.
- [ ] **AC2** The proposed fix lands, pinned by a test: Replace the flat multiplier with something that tracks what the entry is actually made of.

## Impact

The one budget covering the package's public entry is re-authored whenever it fires, so it no longer constrains anything. Two raises in one sprint went in with reasoning attached, but a third would be routine, and the entry is what a consumer importing the barrel actually downloads.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-30 | sdlc-studio | Filed |
