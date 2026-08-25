# BG-01M0WR22: sm controls declare a target floor below 24px, or none at all

> **Status:** Fixed
> **Triaged-by:** Claude Opus 5; agent; claude-opus-5
> **Created:** 2026-08-25
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/react/src/styles.css, scripts/build-geometry-fixture.mjs, e2e/geometry.spec.ts, scripts/check-component-css.mjs
> **Severity:** major
> **Points:** 3

## Summary

`.clara-input--sm` sets `min-height: var(--clara-space-section)`. `space.section` is a **spacing** token, and compact overrides it to `{space.5}` = **16px**. So a small Input in a compact scope declares a 16px floor, well under the 24x24 target minimum PRD:311 requires in every density.

`.clara-button--sm` sets no `min-height` at all - its computed value is `0px` in both densities.

Measured in Chromium from the built package:

```text
comfortable/input-sm   rendered 35px   min-height 24px
compact/input-sm       rendered 27px   min-height 16px
comfortable/button-sm  rendered 36px   min-height 0px
compact/button-sm      rendered 28px   min-height 0px
```

**Stated precisely, because it matters for severity: this is not a live WCAG failure today.** Every one of those controls renders above 24px. But it does so because its text and padding happen to add up, not because anything holds it there. The declared floor is 16px and 0px; the 24px floor is unenforced.

## Steps to Reproduce

1. `grep -n 'clara-input--sm' packages/react/src/styles.css` -> `min-height: var(--clara-space-section)`.
2. `packages/tokens/src/themes/compact.json` overrides `space.section` to `{space.5}`; `space.5` is 16px.
3. Render `<Input size="sm">` inside `<ClaraScope density="compact">` and read `getComputedStyle(el).minHeight` -> `16px`.

Found by the Idris (ux) seat while ruling on BG-01M0WQ92, and confirmed by measurement rather than by reading the token.

## Proposed Fix

`sm` controls take `target-min` as their floor, which is what that token exists for, and never a spacing step. `min-height: var(--clara-size-target-min)` on `.clara-input--sm` and on `.clara-button--sm`.

Add `sm` cases to the geometry gate's fixture so the floor is measured rather than declared. The gate already asserts the 24x24 hit area for every interactive target it renders; this is a gap in the fixture's coverage, not in its assertions.

Worth pairing with a guard that no `--clara-space-*` token is referenced by a `min-height`, `height`, `min-width` or `width` declaration in component CSS. `scripts/check-component-css.mjs` already owns the property-family contract and is the natural home. That would have caught this, BG-01M0WQ92's `.clara-button--icon-only`, and the next one.

## Impact

A floor that is not enforced is not a floor. Anything that reduces the content height - a narrower font stack on another platform, the line-height token F04 still requires and that does not yet exist anywhere in the repo, a shorter label - drops these controls under 24x24 with no gate to say so. The geometry gate added in BG-01M0WQ0X measures `md` controls and would not have caught it either; `sm` was not in its fixture.

The root cause is the one BG-01M0WQ92 is about, in a third place: **a `space` token used as a `size`.** `space.section` means "the gap between sections", and it is doing duty as a control's height floor. When density re-tuned the section gap - correctly, as a gap - it silently re-tuned a target floor.

## Acceptance Criteria

- **AC1** - No component stylesheet sets a size property from a spacing token. `space.none` is
  exempt as this repo's idiom for a literal zero.
- **Verify:** shell pnpm check:component-css
- **Verified:** yes (2026-08-25)

- **AC2** - The geometry gate renders `sm` controls and Textarea, so a size the gate does not draw
  is no longer a size it does not hold.
- **Verify:** shell pnpm check:geometry
- **Verified:** yes (2026-08-25)

## Notes

**The rendered gate does not hold AC1, and that is why AC1 is a deterministic guard.** Measured: with
the 16px floor restored on `.clara-input--sm`, the control still rendered 27px because its text and
padding happened to add up, and `pnpm check:geometry` stayed green. The declared floor was wrong and
the paint was accidentally right. D0096 calls text guards a FLOOR beneath the rendered answer; here
the text guard is the only one that can see it, which is worth recording as a limit of the rendered
gate rather than left as an assumption that it covers everything.

## Verification

**Verified by:** Claude Opus 5 (agent)

**Verification date:** 2026-08-25

**Verification depth:** functional

The guard was mutation-checked: restoring `min-height: var(--clara-space-section)` on `.clara-input--sm` turns `check:component-css` red with the offending selector, property and token named, and reverting turns it green. Recorded as a limit rather than a claim: the rendered gate does NOT catch this one - with the buggy floor restored, `check:geometry` stayed green because the control still painted 27px.

**Not yet adversarially reviewed.** This records that the fix was observed working, not that a second seat has signed it off - the author never records their own review. It stays at Fixed until that lands.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-25 | sdlc-studio | Created via `new` (deterministic) |
