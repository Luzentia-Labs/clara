# BG-01M11JWY: SkeletonGroup and EmptyState create their live region and its text in one commit, the shape this repo records as commonly silent

> **Status:** inbox
> **Created:** 2026-08-27
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/react/src/components/Skeleton/Skeleton.tsx, packages/react/src/components/EmptyState/EmptyState.tsx, packages/react/client-boundary.json, packages/react/src/lib/dev-warning.ts
> **Severity:** Medium
> **Points:** 5

## Summary

`SkeletonGroup` and `EmptyState` each create a `role="status"` region and the text inside it in the SAME COMMIT. This repo has already recorded, and paid for, the finding that this shape is commonly silent.

`packages/react/src/components/Input/Input.tsx:130-135` states it as settled knowledge: "a region that appears in the same commit as its text is commonly not announced at all - so the boundary crossing, the one announcement that matters, was the likeliest to be silent". Input's answer is an announcer that is ALWAYS present and empty until there is something worth saying, so assistive technology has registered the region before any text arrives.

Both components here are exactly the case Input describes, and both are the ordinary usage rather than an edge:

- `{loading && <SkeletonGroup label="Loading invoices">...}` - the group mounts with its label.
- A filter change replaces a rendered table with `<EmptyState reason="filtered" .../>` - the region and its title arrive together. EmptyState's verification record asserted the OPPOSITE as fact ("It still announces, because the state usually appears in response to a filter change") until 2026-08-27; that sentence has been corrected, because the filter-change case is the one MOST at risk, not least.

**Nothing in this repository can decide the question.** jsdom has no announcement model, and axe reads the accessibility tree rather than what is spoken. A review proved the blindness directly: adding `aria-live="off"` beside `role="status"` on both components - which silences them in every screen reader - left 1200 unit tests, `check:axe` at 212 passed and `check:verification` all green. That specific hole is now closed by an assertion in both suites, but it closes only the `off` case, not the timing one.

So what is proved today is: the region exists, carries `role="status"`, is not silenced by `aria-live="off"` or `aria-hidden`, and appears exactly once. What is NOT proved is that a screen reader speaks it.

## Steps to Reproduce

**The blindness, measured.**

1. Add `aria-live="off"` beside `role="status"` at `packages/react/src/components/Skeleton/Skeleton.tsx:46` and `packages/react/src/components/EmptyState/EmptyState.tsx:68`.
2. `pnpm test` -> `Test Files 50 passed (50) / Tests 1200 passed (1200)`, exit 0.
3. `pnpm check:axe` -> `212 passed`, exit 0. `node scripts/check-verification.mjs` -> PASS, exit 0.

That hole is now closed - both suites assert the region is not silenced - so step 2 reddens today. It was open for the whole life of both components.

**The timing question itself cannot be measured here**, and that is the finding rather than a caveat. Confirming it needs a screen reader: mount each component the ordinary way (a `{loading && ...}` toggle, and a filter change that empties a rendered table) and record whether NVDA, JAWS and VoiceOver speak the label. PRD F17 already names screen-reader verification as a stated gap for the library.

## Proposed Fix

**Adopt Input's announcer shape**, which is this repo's own answer to this exact failure - and price it honestly, because it is not free.

The shape: render the live region ALWAYS, empty, and let the text arrive on a later commit, so assistive technology has registered the region before there is anything to announce.

**The cost is a boundary reclassification, and it is the whole decision.** An always-present-then-filled announcer needs an effect, and TRD Section 7 makes state or effects the client test. `SkeletonGroup` and `EmptyState` are both classified `server` today, and EmptyState's story names "a list screen can be a Server Component" as a value it delivers. Three options, in preference order:

1. **A shared `LiveAnnouncer` in `lib/`**, marked `'use client'`, rendered by both. `lib/` is already where infrastructure that is not a component lives - the Field context sits there for exactly that reason - and a Server Component may render a Client Component, so the page stays server-rendered and only the announcer hydrates. This is the option that keeps the stated value. It needs `check-client-boundary.mjs` to accept a server component importing a client module, which should be verified before committing to it.
2. **Reclassify both to `client`**, with a `special` note in `client-boundary.json` recording why - the route `Field`, `Tag` and `Checkbox` all took. Simplest, and it costs EmptyState the property its own story sells.
3. **Accept and document.** Keep the stated gaps as written and never claim the announcement. Cheapest, and it leaves Grace with a loading state and an empty state that may say nothing at all.

**Do not choose on reasoning alone.** The premise - that this shape is commonly silent - is recorded from a measurement on Input, not on these two. Run the screen-reader check in the Steps above FIRST; if both already announce, option 3 is correct and the gap statement is the whole fix. This is Idris's call to make (inclusive design) and Mira's to prove, and those are deliberately two seats.

## Acceptance Criteria

### AC1: The live region exists before its text does

- **Given** D0107's ruling - a shared `LiveAnnouncer` in `lib/`, marked `'use client'`
- **When** SkeletonGroup or EmptyState mounts
- **Then** the region is present and EMPTY on the first commit, and its text arrives on a later one,
  so assistive technology has registered it before there is anything to announce
- **Verify:** vitest "the live region is registered before its text arrives"
- **Verification target:** functional

### AC2: Both components keep their server boundary

- **Given** that EmptyState's story sells "a list screen can be a Server Component"
- **When** the classification is checked
- **Then** SkeletonGroup and EmptyState are still `server`, with only the announcer hydrating
- **And** if `check-client-boundary` refuses a server component importing a client module, D0107's
  recorded fallback applies - reclassify both to client with a `special` note - and the decision is
  amended rather than the guard weakened
- **Verify:** shell node scripts/check-client-boundary.mjs
- **Verification target:** functional

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-27 | sdlc-studio | Created via `new` (deterministic) |
