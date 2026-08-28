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

1. Render a `<DropdownMenu>` whose `items` includes an entry labelled "Save draft".
2. Open it and move keyboard focus onto that entry.
3. Swap the entry IN PLACE for one labelled "Delete everything" - same array length, different
   meaning at the same index.
4. Press Enter.

**Result:** the destructive handler runs once, the safe one zero times, and nothing is written to
the console. Roving focus tracks a collection INDEX, so any substitution that preserves length
while moving meaning between positions misaims exactly as a length change does.

**The gate.** `packages/react/src/components/DropdownMenu/DropdownMenu.tsx:200` reads
`open && itemsRef.current !== items && itemsRef.current.length !== items.length`. The final
conjunct is what makes step 3 silent.

The consumer documentation is not falsified - its heading is broad and the warned case is the one
described - but the check is narrower than the hazard it names.

## Proposed Fix

**Compare a structural signature, not length and not identity.** Replace the `length` conjunct at
`DropdownMenu.tsx:200` with a comparison of the joined labels, kept in `itemsRef` alongside the
array:

```
const sig = items.map((i) => i.label).join('\u0000')
devWarning(open && sigRef.current !== undefined && sigRef.current !== sig, ...)
```

The separator must be a character a label cannot contain, or two entries can trade a boundary and
produce the same string.

**Why not the obvious widening.** `itemsRef.current !== items` is true on EVERY render for the
common React shape of rebuilding the array inline, so it would warn constantly on correct code -
the failure `lib/dev-warning.ts` names in its own docblock as the one that makes a warning
worthless. The signature is stable across a rebuilt array with the same contents, which is the
property that makes it usable.

**Narrower alternative, if the signature proves too noisy:** warn only when the label at the
CURRENTLY FOCUSED index changes. That is the precise hazard and costs one comparison, at the price
of staying silent about a misaim the user has not focused yet.

**Guard:** the new call site must pass `scripts/check-dev-warnings.mjs`, which bundles each
`devWarning` caller with `NODE_ENV=production` and requires the message to be absent - so the
condition has to stay at the call site, not move inside the helper.

## Acceptance Criteria

### AC1: A same-length substitution warns

- **Given** an open DropdownMenu with keyboard focus on an entry
- **When** that entry is swapped IN PLACE for a different one, keeping the array length
- **Then** the same warning fires as for a length change, because the hazard is identical
- **And** it must NOT warn on the common React shape of rebuilding the array inline with the same
  contents. A warning that fires on correct code is the failure `dev-warning.ts` names as making a
  warning worthless, and it is why the naive widening to `!==` was rejected
- **Verify:** vitest "DropdownMenu warns when items change while open"
- **Verification target:** functional

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-27 | sdlc-studio | Created via `new` (deterministic) |
