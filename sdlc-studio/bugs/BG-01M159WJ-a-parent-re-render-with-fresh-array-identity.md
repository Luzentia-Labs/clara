# BG-01M159WJ: A parent re-render with fresh array identity silently resets the listbox highlight to the first option

> **Status:** inbox
> **Severity:** High
> **Points:** 3
> **Affects:** packages/react/src/lib/listbox.ts
> **Created:** 2026-08-29
> **Created-by:** sdlc-studio file
> **Raised-by:** sdlc-studio; agent; v1
> **Raised-in-batch:** none open - raised outside a delivery batch

## Summary

Proved by isolated re-test with no click and no dismissal: with a stable `options` identity the highlight holds on "Swedish krona", and with a fresh array identity it resets to "Pound sterling" while the listbox is still open. It reproduces on both the local and the async paths.

Root cause is `packages/react/src/lib/listbox.ts:69-76`, where the seeding effect depends on `options` IDENTITY rather than on its contents. Any parent that builds its option array inline - `options={items.map(toOption)}` - re-seats the user's highlight on every unrelated re-render of that parent, which is the ordinary way a consumer writes this.

Ruled `[pre-existing]` by both reviewing seats: the effect dates to 8bde87f and is not introduced by either story under review. It is filed here rather than repaired inside them because it lives in the shared engine and reaches Select, Combobox and the MultiSelect that has not been built yet.

One thing this finding SETTLES rather than opens: the clamp effect deleted while building Combobox would not have prevented this, because the seed effect runs first and overwrites. The deletion rationale in that commit message is correct.

## Steps to Reproduce

1. Render a Combobox or Select with an open listbox.
2. Arrow down several options so the highlight is not on the first.
3. Trigger an unrelated re-render of the PARENT that passes a fresh array with identical contents.
4. The highlight resets to the first option with the listbox still open and no user action.

## Proposed Fix

Seed on contents rather than on identity. Depend on a stable derived key (the joined option values, or a length-plus-first-and-last signature) instead of the array reference, or seed only on the `open` transition and reconcile the highlight against the current list rather than re-seeding it. Whichever is chosen, pin it: a test that re-renders the parent with a fresh array of identical contents and asserts the highlight is unchanged, proved red against the current code first.

## Acceptance Criteria

- [ ] **AC1** The behaviour described is corrected: Proved by isolated re-test with no click and no dismissal: with a stable `options` identity the highlight holds on "Swedish krona", and with a fresh array...
- [ ] **AC2** The proposed fix lands, pinned by a test: Seed on contents rather than on identity.

## Impact

In the ordinary consumer pattern of building options inline, a keyboard user's position is silently lost on any unrelated parent re-render. It reaches Select and Combobox today and MultiSelect when built, because all three share the engine per D0105.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-29 | sdlc-studio | Filed |
