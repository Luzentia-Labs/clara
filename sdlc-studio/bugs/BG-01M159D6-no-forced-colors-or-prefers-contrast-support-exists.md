# BG-01M159D6: No forced-colors or prefers-contrast support exists anywhere in the stylesheet, and never has

> **Status:** inbox
> **Severity:** Medium
> **Points:** 8
> **Affects:** packages/react/src/styles.css, scripts/check-component-css.mjs
> **Created:** 2026-08-29
> **Created-by:** sdlc-studio file
> **Raised-by:** sdlc-studio; agent; v1
> **Raised-in-batch:** none open - raised outside a delivery batch

## Summary

`git log -S` over `forced-colors` and `prefers-contrast` returns nothing: neither media query has ever appeared in `packages/react/src/styles.css`.

This was surfaced by the Select and Combobox review as an AMPLIFIER rather than a finding of its own. Both components convey the activedescendant position by a background tint alone, and in Windows High Contrast Mode a background tint is discarded entirely - so a user in forced-colors has no position indicator at all, not merely a low-contrast one. The same reasoning reaches every component whose state is carried by a background: Table row selection, Tag, Badge, the toggle controls.

It is filed separately because the fix is repo-wide and belongs to the accessibility conformance epic rather than to either story under review. Fixing the contrast of a tint does not help a mode that throws the tint away.

## Steps to Reproduce

1. `grep -rn 'forced-colors\|prefers-contrast' packages/react/src/styles.css` - no matches.
2. `git log -S 'forced-colors' -- packages/react/src/styles.css` - no commits.
3. Open any Select or Combobox in Windows High Contrast Mode: the active-option background is discarded and no other channel marks the highlighted option.

## Proposed Fix

Decide the policy first, then apply it: which state indicators must survive forced-colors, and what non-background channel carries each (a border, an outline, a glyph, `Highlight`/`HighlightText` system colours). Then add the `@media (forced-colors: active)` block per component and a guard that fails a component declaring a state purely as `background` with no forced-colors fallback. The guard is the part that stops it recurring - the same reasoning as the non-text contrast pairing this bug's sibling findings require.

## Acceptance Criteria

- [ ] **AC1** The behaviour described is corrected: `git log -S` over `forced-colors` and `prefers-contrast` returns nothing: neither media query has ever appeared in `packages/react/src/styles.css`.
- [ ] **AC2** The proposed fix lands, pinned by a test: Decide the policy first, then apply it: which state indicators must survive forced-colors, and what non-background channel carries each (a border, an outline...

## Impact

Every state Clara conveys with a background tint is invisible in Windows High Contrast Mode. The PRD claims WCAG 2.2 AA, and the library has 35 components carrying keyboard tables whose highlighted state is a tint.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-29 | sdlc-studio | Filed |
