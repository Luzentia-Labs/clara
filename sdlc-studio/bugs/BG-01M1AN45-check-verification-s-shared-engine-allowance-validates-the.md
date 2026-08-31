# BG-01M1AN45: check-verification's shared-engine allowance validates the cited FILE, never the claim

> **Status:** inbox
> **Created:** 2026-08-31
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** scripts/check-verification.mjs
> **Severity:** Medium
> **Points:** 3

## Summary

`pinsASharedEngine` in `scripts/check-verification.mjs` decides whether a verification record may
cite a shared-engine test as its evidence. It checks the FILE, never the CLAIM.

Found by an adversarial seat while re-verifying its own earlier finding. It had already broken the
first version of this allowance - `lib/cx.ts` is imported by 39 of 41 component directories, so a
className-joining utility's test passed as evidence for Select's keyboard model. Four conditions
now close that. This is what survives them.

Reproduction, measured: add to MultiSelect's verification record a line citing
`packages/react/src/lib/__tests__/listbox.test.ts` alongside `packages/react/src/lib/listbox.ts`,
as evidence for "multiple selection ACCUMULATES and the list stays open, and every selected chip is
announced". `node scripts/check-verification.mjs` PASSES. That test file contains zero occurrences
of `closeOnSelect` and zero of `MultiSelect` - it cannot be evidence for either claim.

Why it is NOT stop-ship, in the seat's own assessment and I agree:

- The base rule has exactly the same granularity for ordinary component tests. A record may cite its
  own component's suite for a claim that suite does not make, and nothing catches that either. This
  allowance is not weaker than the rule it extends; it is the same strength.
- The same-line condition forces the record to NAME the shared module, so a reader sees which engine
  is being leaned on rather than a bare test path.
- The blast radius is three components against one genuinely shared file, not 39 against an
  unrelated utility. Only `listbox` currently has a hook-exporting module with a test in
  `lib/__tests__/`.
- Nothing is published: both packages are at 0.0.0 and `NPM_TOKEN` is unset.

## Steps to Reproduce

1. Append to `packages/react/src/components/MultiSelect/verification.md`:

   `- Multiple selection accumulates and every chip is announced - ` then a backticked
   `packages/react/src/lib/__tests__/listbox.test.ts` and a backticked
   `packages/react/src/lib/listbox.ts`, both on that one line.

2. Run `node scripts/check-verification.mjs`.

3. Observe **PASS**. Expected: a refusal, because that file asserts neither claim.

4. Confirm the citation is empty evidence:
   `grep -c 'closeOnSelect\|MultiSelect' packages/react/src/lib/__tests__/listbox.test.ts` returns
   0 for both.

The four conditions that DO hold, and which is doing the work in each: (1) the path is under a
`lib/__tests__/` directory; (2) `MultiSelect.tsx` really does import `lib/listbox`; (3) the line
really does name `lib/listbox.ts`; (4) `lib/listbox.ts` really does export `useListbox`. Every one
is true. None of them looks at what the test asserts.

## Proposed Fix

Two options, and the cheap one may be the right one.

**Option A - require the cited test to mention the subject.** When a record cites a shared-engine
test, require that test file to contain the component's name, or a token the record supplies. Cheap,
mechanical, and it would reject the MultiSelect repro above. It is also easy to satisfy dishonestly
by writing the component's name in a comment, so it raises the cost of a bad citation without making
one impossible.

**Option B - accept the granularity and say so.** The base rule cannot check claim-level relevance
either, and a guard that half-checks is worse than one whose limit is written down, because the
half-check reads as a guarantee. Add the limit to the guard's own header comment and to
`sdlc-studio/definition-of-done.md`: *citation checks prove a path resolves and that the file could
plausibly hold the evidence; they do not prove the evidence is there. That is what review is for.*

**Recommendation: B, plus the narrow half of A.** Take A only where it is free - the component's
name appearing somewhere in the cited test - and write the limit down rather than implying a
guarantee the guard cannot give. What must not happen is a third round of tightening that leaves a
reader believing the citation check certifies relevance, which is the belief that let the `cx.ts`
hole sit unnoticed in the first place.

Not urgent: the same-line condition already forces the record to name the engine, so a bad citation
is at least visible to a human reading the record.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-31 | sdlc-studio | Created via `new` (deterministic) |
