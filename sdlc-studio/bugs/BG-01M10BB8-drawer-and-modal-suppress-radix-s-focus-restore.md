# BG-01M10BB8: Drawer and Modal suppress Radix's focus restore with nothing witnessing it, and jsdom cannot see the race

> **Status:** inbox
> **Created:** 2026-08-27
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/react/src/components/Drawer/Drawer.tsx, packages/react/src/components/Modal/Modal.tsx, e2e/stacking.spec.ts, packages/react/src/components/Drawer/Drawer.stories.tsx
> **Severity:** Medium
> **Points:** 3

## Summary

`packages/react/src/components/Drawer/Drawer.tsx:101` carries `onCloseAutoFocus={(event) => event.preventDefault()}`, and its comment states the reason: Clara restores focus itself in the shared hook, Radix's own restore runs against a portal host Clara has already removed, and letting it also try means two mechanisms racing. Modal carries the identical line.

Deleting it changes nothing any gate can see.

The reason is a real jsdom limit rather than a missing assertion, and it is worth stating precisely. On the CLOSE route both restores target the same element - the opener - so they agree and no observation separates them. They only disagree when `returnFocus` names something other than the opener, or on the UNMOUNT route where Radix's stored element has been removed and its restore lands on `document.body`. That second case is where the defect was actually measured, in Chromium, and it is the case jsdom cannot reproduce: `overlay-focus.ts:60-82` exists because of it and its own comment records the measurement ("the loop reported 3 candidates and 3 focusable, focused one, and the page still ended on BODY").

So this is a mechanism whose deletion leaves everything green, which is the class this epic keeps finding - but unlike the others it is not fixable by writing a better jsdom test. It needs a browser.

Raised by the engineering review seat while closing US-01M0GMWW, alongside four other unwitnessed mechanisms; the other four were closed with tests in that pass and this one could not be.

## Steps to Reproduce

1. Delete line 101 of `packages/react/src/components/Drawer/Drawer.tsx`:
   `onCloseAutoFocus={(event) => event.preventDefault()}`
2. `pnpm vitest run` -> `Test Files 50 passed (50)` / `Tests 1200 passed (1200)`.
3. `pnpm check` -> every deterministic guard passes.

Measured against the tree at the close of US-01M0GMWW, with the strengthened focus harness already in place - so this is not the weak-harness defect the same review found in AC2, which that harness fix DID close. The decoy discriminates the named restore from the fallback and still cannot see this.

## Proposed Fix

**A browser assertion on the UNMOUNT route, which is the only route where the two restores disagree observably.**

Add a Storybook story that mounts a Drawer from `{open && <Drawer open .../>}` with a control INSIDE the panel that unmounts it - the "Save and close" shape `drawer.test.tsx` already uses, because the background is genuinely inert and a user cannot click through it. Then in `e2e/stacking.spec.ts`:

1. Open the drawer, click the inside control so the component unmounts.
2. Assert `document.activeElement` is the opener, BY IDENTITY, and is not `document.body`.

With the suppression removed, Radix's FocusScope restores to the element it stored - the removed opener - and focus lands on `document.body`, which is precisely the strand `overlay-focus.ts`'s deferred cleanup exists to prevent. That is the assertion.

**Cover Modal in the same pass.** It carries the identical line for the identical reason and is equally unwitnessed; a fix that covers one of two components implementing one rule is how the rule returns in the component nobody enrolled - which is the same shape as the scroll-container contract gap found in the same review.

**Do not attempt this in jsdom.** It has no layout, and its focus model does not reproduce the FocusScope race; a jsdom test that appeared to pass here would be a false green by construction, not a flaky one.

## Acceptance Criteria

### AC1: Deleting the suppression reddens something

- **Given** `onCloseAutoFocus={(event) => event.preventDefault()}` on Drawer and on Modal
- **When** either is deleted
- **Then** a browser assertion fails
- **And** it must be a BROWSER assertion. The two restores only disagree observably on the UNMOUNT
  route, and jsdom has no announcement model and does not reproduce the FocusScope race - a jsdom
  test that appeared to pass here would be a false green by construction
- **Verify:** shell pnpm test:e2e -g "an overlay that unmounts returns focus to its opener"
- **Verification target:** functional

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-27 | sdlc-studio | Created via `new` (deterministic) |
