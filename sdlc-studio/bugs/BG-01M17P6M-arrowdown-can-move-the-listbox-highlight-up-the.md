# BG-01M17P6M: ArrowDown can move the listbox highlight UP the screen, because rendering buckets by group while the engine numbers by array index

> **Status:** inbox
> **Severity:** High
> **Points:** 5
> **Affects:** packages/react/src/components/Combobox/Combobox.tsx, packages/react/src/lib/listbox.ts, packages/react/src/components/Combobox/__tests__/Combobox.test.tsx
> **Created:** 2026-08-30
> **Created-by:** sdlc-studio file
> **Raised-by:** sdlc-studio; agent; v1
> **Raised-in-batch:** none open - raised outside a delivery batch

## Summary

Measured by execution against the shipped Combobox. `[X, A in G1, Y]` renders `X, Y, A` but ArrowDown walks `X, A, Y`. `[A in G, Z in H, B in G]` renders `A, B, Z` but walks `A, Z, B`. So Down Arrow moves the highlight UP the screen, and Up Arrow moves it down.

Cause: `Combobox.tsx` buckets options by group for RENDERING - all ungrouped share one bucket, each bucket placed at its first member - while `lib/listbox.ts` numbers options by their position in the source array. The two orders agree only when the array is already grouped.

Ruled `[pre-existing]` by execution: `git diff 090edfb 73f8ff0` shows the grouping code byte-identical, so no repair introduced it. The existing flat-index test uses options already in group order, so it cannot see the divergence.

What makes it worth filing NOW rather than leaving: the Combobox docstring was rewritten under D0127 to document exactly these shapes as supported, without disclosing that the keyboard walk disagrees with the screen in two of the three worked examples. The documentation got better and, in this one respect, more misleading.

AC1 requires the WAI-ARIA combobox pattern, and a highlight that moves against the arrow key is a straightforward failure of it.

## Steps to Reproduce

1. Render a Combobox with `[{X}, {A, group: 'G1'}, {Y}]`.
2. Open it. The rendered order is X, Y, then group G1 containing A.
3. Press ArrowDown repeatedly and read `aria-activedescendant`.
4. The walk is X, A, Y - the second step jumps from the top of the list to the bottom.

## Proposed Fix

Make the engine's index space match the RENDER order rather than the array order. Either flatten the bucketed structure back into a render-ordered array and hand THAT to `useListbox`, or have the grouping return the index mapping and translate. Prefer the first: two index spaces is the drift `lib/overlay-focus.ts` exists to prevent, and the engine's own comment already says `aria-activedescendant` can name only one.

Pin it with a test that walks ArrowDown through a list whose array order and render order differ, asserting the walk matches the RENDERED sequence - the existing flat-index test cannot see this because its options are already in group order.

## Acceptance Criteria

- [ ] **AC1** The behaviour described is corrected: Measured by execution against the shipped Combobox.
- [ ] **AC2** The proposed fix lands, pinned by a test: Make the engine's index space match the RENDER order rather than the array order.

## Impact

A keyboard user of a grouped Combobox has the highlight jump to a non-adjacent option, in the ordinary case of an array that is not pre-sorted by group. It reaches Combobox now and MultiSelect when built, since both take the shared engine per D0105.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-30 | sdlc-studio | Filed |
