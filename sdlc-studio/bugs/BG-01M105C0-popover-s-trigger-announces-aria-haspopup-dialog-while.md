# BG-01M105C0: Popover's trigger announces aria-haspopup=dialog while the panel is a group

> **Status:** inbox
> **Created:** 2026-08-27
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/react/src/components/Popover/Popover.tsx
> **Severity:** Medium
> **Points:** 2

## Summary

Radix hardcodes `aria-haspopup="dialog"` on `Popover.Trigger` (`@radix-ui/react-popover` dist/index.mjs:90). Clara sets the panel's role to `group` deliberately - a popover is not a dialog, it traps nothing, and calling it one would tell a screen-reader user to expect modal semantics they will not get.

The result is a mismatch in the shipped DOM: the trigger announces "has dialog popup" and what opens is a group. axe does not flag it, and no acceptance criterion covers it.

Measured and reported by a review seat in round 5; recorded nowhere until now.

The options are not symmetric:

1. **Override the trigger's `aria-haspopup`.** Clara does not currently render the trigger element - `asChild` hands it the consumer's node - so overriding means reaching into a prop Radix sets, which is the kind of coupling that breaks on a minor upgrade.
2. **Change the panel's role to `dialog`.** Rejected on its face: it would be a lie about the behaviour, and `role="dialog"` on a non-modal, non-trapping surface misleads exactly the users the role exists to help.
3. **Accept and document.** "has dialog popup" is imprecise rather than wrong - something does pop up and it is a distinct surface - and no assistive technology behaviour is known to depend on the distinction here.

This is the UX seat's call, which is why it is filed rather than decided: Idris owns whether the imprecision is acceptable, and Mira would own proving whatever is chosen.

## Steps to Reproduce

1. `pnpm build && pnpm storybook`, open **Popover / Default**, and inspect the trigger:
   `aria-haspopup="dialog"`, set by Radix at `@radix-ui/react-popover` `dist/index.mjs:90` and not
   passed by Clara.
2. Open the popover and inspect the panel: `role="group"`, set deliberately by
   `packages/react/src/components/Popover/Popover.tsx`.
3. Run axe over the open state (`pnpm test` covers this in the Popover suite): **no violation**.
   The mismatch is outside every rule axe ships.
4. Grep the story's criteria for `haspopup`: no acceptance criterion mentions it, so nothing in
   the gate has an opinion either way.

The observable effect is in the announcement, not in the DOM validity: a screen reader says "has
dialog popup" on the trigger, and what opens announces as a group.

## Proposed Fix

**No code change until the UX seat rules.** This is filed as a decision, and the three options in
the summary are not equal-cost.

If the ruling is **accept** (the expected outcome): record it as a decision row, and add the
mismatch to the Popover component's `verification.md` keyboard-and-announcement table so the next
reader finds it stated rather than discovering it. No code moves.

If the ruling is **override**: it cannot be done from the Popover surface as written. Clara does not
render the trigger element - `asChild` hands it the consumer's node - so the override means either
wrapping the consumer's node (which changes the DOM consumers get, a one-way door) or setting the
attribute in a ref callback after mount (which fights Radix on every re-render). Both need their own
story; neither is a patch.

**Rejected outright:** changing the panel to `role="dialog"`. A popover traps nothing and is not
modal, so the role would promise semantics the component does not deliver - a worse defect than the
imprecision it would fix.

## Acceptance Criteria

### AC1: The mismatch is recorded where a reader will find it

- **Given** D0108's ruling to accept Radix's hardcoded `aria-haspopup="dialog"`
- **When** Popover's verification record is read
- **Then** it states that the trigger announces "has dialog popup" while the panel is a `group`, and
  why the panel's role is deliberately not `dialog` - a popover traps nothing, and the role would
  promise modal semantics it does not deliver
- **Verify:** shell node scripts/check-verification.mjs --component Popover
- **Verification target:** functional

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-27 | sdlc-studio | Created via `new` (deterministic) |
