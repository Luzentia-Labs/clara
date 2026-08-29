# BG-01M17PCH: Select and Combobox convey disabled by text colour alone, with no disabled surface, unlike every sibling control

> **Status:** inbox
> **Severity:** Medium
> **Points:** 3
> **Affects:** packages/react/src/styles.css, packages/tokens/src/component/select.json, packages/tokens/src/component/combobox.json, packages/tokens/contrast-required.json
> **Created:** 2026-08-30
> **Created-by:** sdlc-studio file
> **Raised-by:** sdlc-studio; agent; v1
> **Raised-in-batch:** none open - raised outside a delivery batch

## Summary

Measured in all four theme and density scopes by a review seat, three rounds running: a disabled Combobox's background is identical to an enabled one and to the page, while a disabled Input paints `rgb(242,240,237)` in light and `rgb(58,57,55)` in dark. Select carries the same gap.

`styles.css` sets only `color: var(--clara-color-fg-muted)` on the disabled state - the same colour used for a group label and a message - and no background. So disabled is carried by text colour alone, and by a colour that also means something else.

This is the defect class the stylesheet already carries a comment about for Checkbox, Radio and Switch, where an earlier change 'quietly removed the only visual signal'. It has been reported in three consecutive review rounds without a bug id, which is how a system-level inconsistency ships: each round it was correctly judged non-blocking for the unit under review, and no round owned it as a cross-component problem.

## Steps to Reproduce

1. Render a disabled Select and a disabled Input side by side.
2. Compare computed `background-color` in each of the four theme and density scopes.
3. The Input paints a disabled surface; the Select and Combobox do not.

## Proposed Fix

Give both controls the disabled surface their siblings use - `bg-disabled` plus `fg-disabled` rather than `fg-muted` alone - and enrol the pair in `contrast-required.json` as every other disabled pairing is. Add both to `SHAPE_CONTRACT` so the background cannot be dropped silently, since jsdom resolves no `var()` and no test can see it.

Decide deliberately whether `fg-muted` is ever right for a disabled state: it is currently doing double duty as the group-label and message colour, which is what makes the disabled state indistinguishable from ordinary secondary text.

## Acceptance Criteria

- [ ] **AC1** The behaviour described is corrected: Measured in all four theme and density scopes by a review seat, three rounds running: a disabled Combobox's background is identical to an enabled one and to...
- [ ] **AC2** The proposed fix lands, pinned by a test: Give both controls the disabled surface their siblings use - `bg-disabled` plus `fg-disabled` rather than `fg-muted` alone - and enrol the pair in...

## Impact

Two controls state 'unavailable' in a weaker way than the rest of the library, using a colour that elsewhere means 'secondary'. Disabled is also colour-alone here, which is the rule D0100 and D0104 exist to enforce.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-30 | sdlc-studio | Filed |
