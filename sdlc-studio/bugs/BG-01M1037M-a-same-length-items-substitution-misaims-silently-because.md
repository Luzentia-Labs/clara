# BG-01M1037M: A same-length items substitution misaims silently, because the warning is gated on length

> **Status:** inbox
> **Created:** 2026-08-27
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/react/src/components/DropdownMenu/DropdownMenu.tsx
> **Severity:** Medium
> **Points:** 2

## Summary

The DropdownMenu `items`-changed warning is gated on a LENGTH change, so a same-length substitution is silent while carrying the identical hazard.

Measured by a review seat: with keyboard focus on an entry labelled "Save draft", swapping that entry in place for "Delete everything" ran the destructive handler once and the safe one zero times, with NO console warning. Roving focus tracks a collection INDEX, so any change that keeps the length but moves meaning between positions misaims in exactly the way the warning exists to flag.

The consumer-facing docs are not falsified - the heading is broad and the warned case is the one described - but the check is narrower than the hazard.

\*\*Why it is gated at all:\*\* the obvious widening is `itemsRef.current !== items`, which is true on EVERY render for the common React shape of rebuilding an array inline. That would warn constantly on correct code, which `dev-warning.ts`'s own docblock names as the failure that makes a warning worthless.

Candidate fixes: compare a cheap structural signature (the joined labels) rather than identity or length; or warn only when the entry at the currently-focused index changes label, which is the precise hazard and costs one comparison.

## Steps to Reproduce

{{steps}}

## Proposed Fix

{{fix}}

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-27 | sdlc-studio | Created via `new` (deterministic) |
