# BG-01M0WZGB: The component-CSS literal gate does not treat a percentage as a literal

> **Status:** Fixed
> **Triaged-by:** claude-implementer; agent; opus-5
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

## Acceptance Criteria

### AC1: A hand-typed percentage is refused

- **Given** component CSS containing `width: 25%`
- **When** the literal gate runs
- **Then** it fails naming the literal
- **Verify:** shell node scripts/prove-guards-fail.mjs --only "hand-typed percentage"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC2: Structural percentages are still permitted, and the distinction is stated

- **Given** `width: 100%`, `translateX(-100%)` and `top: 50%`
- **When** the gate runs
- **Then** all three pass - `100%` means "all of it", `transform` is already structural, and a
  percentage on a PLACEMENT property is geometry rather than appearance
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC3: The percentages that were design values became tokens

- **Given** Skeleton's four width variants and ProgressBar's indeterminate segment
- **When** the stylesheet is read
- **Then** each resolves through a tier 3 token rather than a raw percentage
- **Verify:** grep "clara-skeleton-width-quarter" packages/react/src/styles.css
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

> **Verification depth:** functional

## Fixed (2026-08-26)

`%` joins the unit list, with a stated rule about which percentages are design values.

**The first attempt was itself the defect it was fixing, and that is worth recording.** Appending
`%` to `UNITS` looked correct and matched NOTHING: `%` is not a word character, so the trailing
`\b` in the literal pattern demands a word character after it, and a declaration ends `25%;` where
both sides are non-word. The bug's own probe still reported PASS. A fix that cannot fail is the same
shape as the hole it was closing, which is why the prover now carries an entry for it.

The rule, once the pattern actually matched:

| Shape | Verdict | Why |
| --- | --- | --- |
| `width: 25%`, `inline-size: 25%` | **refused** | A decision about how wide something looks. A token, like every other such decision. |
| `width: 100%` | permitted | "All of the container". There is no other number it could be. |
| `transform: translateX(-100%)` | permitted | Already structural; an offset by an element's own extent. |
| `top: 50%`, `clip-path: circle(50%)` | permitted | PLACEMENT, not appearance - the centring idiom. Not added to `STRUCTURAL`, which would also have exempted `top: 13px`, a real design value. |

Four genuine violations were found once the pattern worked, and all four were design values wearing
a structural disguise: Skeleton's `--full` / `--three-quarters` / `--half` / `--quarter` widths,
which are literally exposed as a prop, and ProgressBar's indeterminate segment. They are now tier 3
tokens. The segment carries its derivation in its comment, because the traverse period falls out of
it - segment + track = 1.25 track-widths = five segment-widths - so the two must move together.
