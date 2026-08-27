# Drawer - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from the
tests that actually run, so it can be checked rather than believed.

A panel attached to an edge of the viewport.

**Boundary:** client-only (see `../../../client-boundary.json`). `onClose` is a function prop, which
TRD Section 7 makes the boundary test, and Radix's focus trap uses state and effects internally.

## Keyboard

| Key | Result |
| --- | --- |
| Tab | Cycles within the panel. Focus does not leave while it is open. |
| Shift+Tab | The same, backwards. |
| Escape | Dismisses, unless `dismissible={false}`. |
| Enter / Space | Activates the focused control, unchanged from the platform. |

## Recorded manual keyboard pass

**Not performed. This is outstanding, and it is the one artefact here that automation cannot
supply.**

What a real pass adds that the tests cannot: whether the slide reads as coming from the right edge
rather than merely appearing, whether the focus ring is visible against the panel surface in both
themes, and what a screen reader says when the panel opens - as opposed to what the accessibility
tree contains.

**To record one:** open and dismiss in every placement, by every route, in both themes and both
densities, pointer unused; then replace this section with the date, the OS and browsers, and the
result per row.

## Accessibility

`role="dialog"` with `aria-modal`, from Radix. The `title` is required and becomes the accessible
name: an unnamed dialog announces as "dialog" and nothing more, whichever edge it is on.

`description`, when given, is wired through `aria-describedby` and announced after the title. Use it
for the consequence of the action rather than for instructions.

While the drawer is open the background is hidden from assistive technology and inert to the
pointer. That is Radix's, and it is load-bearing enough that a test scenario written against a
background button had to be rewritten: the button genuinely could not be clicked, which is the
behaviour working.

## Focus parity with Modal is by IDENTITY

Both components call `useOverlayFocusRestore` in `../../lib/overlay-focus.ts`. That hook is about a
hundred lines whose every comment records a defect measured across nine adversarial review rounds:
the opener captured in the wrong commit, the restore firing on mount and stealing focus, the unmount
route stranding focus on `document.body`, the two-phase ordering that lets a named target beat
another overlay's anonymous fallback.

It was extracted from Modal rather than copied, and Modal's 62 tests and 11 acceptance criteria were
re-run unchanged to prove the extraction preserved behaviour. AC2 asks for parity asserted by
identity; a copy would inherit the code and not the reasons, and the first person to simplify one of
them would reintroduce a strand in one overlay and not the other.

The parity tests run the SAME scenarios against both components, so they fail the moment somebody
gives Drawer its own copy.

## Motion, and why Drawer has some where Modal has none

D0094 ruled Modal does not animate, and its argument was specific: a centred dialog has no spatial
origin. A drawer has one - it is attached to an edge, and where it came from is where it goes back
to. D0100 permits exactly that meaning, so the panel slides in from its own edge at
`duration.state-change` with `easing.enter`.

It exits instantly, per D0094's pre-commitment. Under `prefers-reduced-motion: reduce` the slide is
REMOVED rather than replaced: this is D0100's Class A, where the motion is not the information. The
state change is already carried louder than any slide could carry it, because the viewport dims,
focus relocates and the background goes inert.

## What is verified automatically

- All three placements render with their own class, default to `right`, name themselves, and pass
  axe - `__tests__/drawer.test.tsx`
- **Focus parity with Modal, run as the same scenarios against both**: return to the opener by
  identity, an `initialFocus` target honoured, no focus theft while closed, and restoration on the
  UNMOUNT route - `__tests__/drawer.test.tsx`
- Scroll lock engages and compensates for exactly the scrollbar width it removes, and releases on
  close - `__tests__/drawer.test.tsx`
- `dismissible={false}` blocks Escape and an outside pointer, and the close button still works and
  fires `onClose` exactly once - `__tests__/drawer.test.tsx`
- A `description` reaches the dialog's ACCESSIBLE DESCRIPTION and a `footer` renders, and a drawer
  with no description carries no `aria-describedby` at all - `__tests__/drawer.test.tsx`
- It renders through `ClaraPortal` and takes its stacking from a layer token - `check:overlay-contract`
- Token-only styling, plus the panel's containment (`box-sizing`, `max-block-size`) and its scroll
  container (`overflow-y` on the body, `flex-shrink: 0` on the body's children) - `check:component-css`
- axe in all four theme x density combinations - `check:axe`
- **In a real browser** (`e2e/stacking.spec.ts`, run by `pnpm test:e2e`):
  - each placement RESTS against the edge it names, spans the other axis, and does not fill the
    viewport - measured against the viewport box, not inferred from a class name
  - each placement ENTERS from outside that edge - measured on the animation's paused first frame,
    because the keyframe's NAME is a proxy for its direction and swapping only the keyframe bodies
    left every other gate green
  - each placement's slide is removed entirely under `prefers-reduced-motion: reduce`
  - the panel declares a `color` that resolves per theme, checked against both shipped stylesheets

## Stated gaps

- **CLOSED 2026-08-27, recorded rather than deleted.** This section previously read "The slide is
  not verified in a browser, and gate 9's fixture cannot hold it ... The story file exists for it;
  the assertion does not yet." Half of that is still true and half of it went stale without being
  corrected: gate 9's fixture genuinely cannot hold a portalled overlay - it is a
  `renderToStaticMarkup` render and `ClaraPortal` returns null on the server by design (US-01M0GM61
  AC4) - but the assertions have existed since commit `ae6fd29` and now live in
  `e2e/stacking.spec.ts`, driven against a served Storybook build. A review found this record
  stating a closed gap as open, which is the same defect as claiming an open one closed: a record
  nobody re-reads is a record nobody can trust.
- **The entrance is sampled, not watched.** The browser assertion pauses the animation at
  `currentTime = 0` and reads the box. That proves where the travel STARTS and that it starts
  off-screen on the correct side; it does not prove the easing, the duration a person perceives, or
  that the panel arrives without overshoot. Gate 7 owns appearance.
- **Radix's own focus restore is suppressed with nothing witnessing it** (BG-01M10BB8).
  `Drawer.tsx` passes `onCloseAutoFocus` a `preventDefault` because Clara restores focus itself and
  two mechanisms racing strands focus on `document.body`. Deleting that line leaves all 1200 tests
  and every guard green. It is not a missing assertion so much as a jsdom limit: the two restores
  only disagree observably on the UNMOUNT route, in a browser. Modal carries the identical line and
  is equally unwitnessed.
- **Scroll lock is asserted as a MECHANISM, not as an absence of shift.** jsdom computes no layout,
  so the test observes that the page is locked and that the scrollbar's width is handed back as
  padding. Whether the page actually holds still is gate 7's.
- **Screen reader testing is not automated.** PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7, US-01M0WSME).
