# BG-01M0WQ92: Comfortable control height renders 48px, not the 40px the PRD specifies

> **Status:** Fixed
> **Triaged-by:** Claude Opus 5; agent; claude-opus-5
> **Created:** 2026-08-25
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/tokens/src/semantic/geometry.json, packages/tokens/src/primitive/base.json, packages/react/src/styles.css, packages/tokens/src/__tests__/density.test.ts, sdlc-studio/prd.md
> **Severity:** major
> **Points:** 5

## Summary

PRD:308 is explicit: *"Comfortable control height is 40px; compact control height is 32px."*

The token says otherwise. `packages/tokens/src/semantic/geometry.json` sets `size.control-height` to `{space.8}`, and the primitive scale is `6: 24px, 7: 32px, 8: 48px`. So comfortable resolves to **48px**. Measured in Chromium from the built package, every comfortable control is 48px: Button, Input, NumberInput, PasswordInput and SearchInput.

**There is no 40px step on the space scale at all.** The scale jumps 32 -> 48. Whoever wired `control-height` to `{space.8}` had no 40px to choose, and the mismatch has sat there since.

Two further heights are wrong for reasons of their own:

- **Button in compact renders 36px, not 32px.** Its padding comes through a tier-3 alias, which is frozen at the comfortable value - that is BG-01M0WQY1, not a separate defect, and this bug does not double-count it.
- **IconButton renders 37px in BOTH densities.** `.clara-button--icon-only` sets `min-width`/`min-height` to `var(--clara-size-target-min)` (24px) rather than the control height, so it is density-invariant by construction and its actual height is whatever its content happens to make it.

## Steps to Reproduce

1. `pnpm build && pnpm check:geometry`
2. The gate reports, from a real browser:

```text
comfortable/button-md (button): 48px, want 40px
comfortable/input-md (input): 48px, want 40px
comfortable/numberinput-md (input): 48px, want 40px
comfortable/passwordinput-md (input): 48px, want 40px
comfortable/searchinput-md (input): 48px, want 40px
comfortable/iconbutton-md (button): 37px, want 40px
compact/iconbutton-md (button): 37px, want 32px
```

Compact Input is correct at 32px, which is what makes the comfortable figure a token error rather than a layout one.

## Proposed Fix

This needs a decision before code, because the PRD and the primitive scale disagree and neither is obviously wrong.

- **Option A - add a 40px step** to the space scale and point `control-height` at it. Honours PRD:308 exactly. Costs a new primitive on a scale that is otherwise a clean ratio, and 40px is not a multiple of the 8px rhythm the rest of the scale follows.
- **Option B - amend the PRD to 48px.** Honours the scale. But 48px is a large control for a dense ERP grid, and PRD:312's whole argument is that Clara removes chrome rather than crowds content - a 48px comfortable row works against the product's own density thesis.
- **Option C - decouple `control-height` from the space scale**, as a `size` value in its own right. `size` already exists as a tier 2 family holding `control-height` and `target-min`; nothing requires it to alias `space`.

Option C looks right and is the smallest change, but this is a design decision on a permanent public token, so it belongs to the Idris seat and the operator, not to whoever picks this bug up.

Separately and not blocked on that: `.clara-button--icon-only` should take the control height like every other `md` control, keeping `target-min` as the floor it must never go below rather than as its size.

## Impact

Control height is the single most load-bearing number in a dense ERP form: every row rhythm, every table cell, every inline action sits on it. Shipping 48px means every consumer's vertical rhythm is built on the wrong grid, and `size.control-height` is a **tier 2 token - public API, permanent at publish**. Changing it after release is a breaking visual change for every consumer already shipped.

**Correction to this bug's first filing.** I wrote that `density.test.ts` never asserts `control-height`. That was wrong, and the truth is worse. Line 73 asserts it explicitly:

```js
// AC1: a control must hold its text at either density, and never fall under the target floor.
expect(height).toBe(density === 'compact' ? 32 : 48)
```

The gate does not miss the height. It **pins it at 48 and cites AC1 while doing so** - a test written to agree with the code rather than with the requirement, which converts the defect into a protected invariant. Anyone correcting the token to 40 gets a red test telling them they are wrong.

That line must not simply be re-pinned at 40. It should assert the identity the number comes from, in both densities:

```
control-height === lineBox + 2 x control-padding-y
```

which fails on 48 today, passes on 40, and keeps failing if the padding later moves without the height.

## Acceptance Criteria

- **AC1** - Every `md` control renders at its density's height, measured in a real browser from the
  built package: 40px comfortable, 32px compact. Covers Button, IconButton, Input, NumberInput,
  PasswordInput and SearchInput, so a fix that corrects the token but leaves a component sized off
  something else still fails.
- **Verify:** shell pnpm check:geometry
- **Verified:** yes (2026-08-25)

- **AC2** - The token test asserts the DERIVATION - `control-height === lineBox + 2 x
  control-padding-y` - alongside PRD:308's two figures, rather than a constant pinned to whatever
  the token happens to say. The old assertion agreed with the code and protected the defect.
- **Verify:** shell pnpm check:density-tokens
- **Verified:** yes (2026-08-25)

## Verification

**Verified by:** Claude Opus 5 (agent)

**Verification date:** 2026-08-25

**Verification depth:** functional

Measured in Chromium from the built package. Before: 48px comfortable across Button, Input, NumberInput, PasswordInput and SearchInput, and IconButton density-invariant at 37px. After: 40px comfortable, 32px compact, all six controls, both densities. The token test now asserts the derivation and fails on the old value rather than protecting it.

**Not yet adversarially reviewed.** This records that the fix was observed working, not that a second seat has signed it off - the author never records their own review. It stays at Fixed until that lands.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-25 | sdlc-studio | Created via `new` (deterministic) |
