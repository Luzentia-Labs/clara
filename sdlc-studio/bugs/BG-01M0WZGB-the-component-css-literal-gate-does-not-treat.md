# BG-01M0WZGB: The component-CSS literal gate does not treat a percentage as a literal

> **Status:** inbox
> **Created:** 2026-08-26
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** scripts/check-component-css.mjs, scripts/prove-guards-fail.mjs
> **Severity:** major
> **Points:** 3

## Summary

`scripts/check-component-css.mjs:89` enumerates the units a raw literal can carry:

```js
const UNITS = 'px|rem|em|pt|pc|cm|mm|in|q|ch|ex|vh|vw|vmin|vmax|svh|lvh|dvh|ms|s'
```

`%` is absent. Verified by probe: appending `.clara-probe-pct { width: 25%; border-radius: 50%; }` to `packages/react/src/styles.css` leaves `pnpm check:component-css` at **PASS**.

So a hand-typed percentage is invisible to the guard whose entire job is to refuse hand-typed values in component CSS.

## Steps to Reproduce

1. Append `.clara-probe-pct { width: 25%; border-radius: 50%; }` to `packages/react/src/styles.css`.
2. `node scripts/check-component-css.mjs` -> `PASS`.
3. Compare with `width: 25px`, which is correctly refused.

Raised by the Idris (ux) seat while ruling on the motion foundation (D0100), which is how it was found rather than by the guard.

## Proposed Fix

Add `%` to `UNITS`, then allow the cases where a percentage is structural rather than a design value - the same shape as the `calc()` carve-out already made for spacing tokens in the space-as-size rule.

Concretely: refuse a percentage in a property that carries a design value, and allow `0%` and `100%` everywhere, since neither expresses a chosen quantity. `50%` on `border-radius` should be refused with a message pointing at `--clara-radius-round` (D0100 adds that token for exactly this), and a fractional width should be refused pointing at the layout primitives.

The rule needs its `prove-guards-fail.mjs` entry in the same change, or it repeats this bug's own history: a clause that exists and is never observed failing.

## Impact

It is the path of least resistance for the two components about to be built. D0100 requires a Spinner ring that is actually a circle and a ProgressBar with a quarter-track segment, and `border-radius: 50%` and `width: 25%` are the obvious way to write both. Neither would be caught, and both would be exactly the kind of hand-typed geometry that stops responding to a token change.

This is the same class of hole that adding `ms|s` to the list closed. That addition was made because a duration literal slipped through; the list is a denylist of units somebody thought of, and D0096 already records that a whitelist of names cannot be complete over CSS.

Severity is bounded by what a percentage MEANS, and that is the honest part: a percentage is relative to a parent, so it is not always a magic number the way `25px` is. `width: 100%` is idiomatic and carries no design decision. So the fix is not simply adding `%` to the list.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-26 | sdlc-studio | Created via `new` (deterministic) |
