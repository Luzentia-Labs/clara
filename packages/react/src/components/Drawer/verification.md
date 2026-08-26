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
- It renders through `ClaraPortal` and takes its stacking from a layer token - `check:overlay-contract`
- Token-only styling - `check:component-css`
- axe in all four theme x density combinations - `check:axe`

## Stated gaps

- **The slide is not verified in a browser, and gate 9's fixture cannot hold it.** jsdom resolves
  no animation, so nothing here proves the panel slides from the correct edge or that the
  reduced-motion branch removes it. Gate 9 asserts exactly this for Spinner and ProgressBar, but its
  fixture is a `renderToStaticMarkup` render and `ClaraPortal` returns null on the server by design
  (AC4 of the foundation story) - so a portalled overlay cannot appear in it at all. The assertion
  needs a client render, which the scoping gate already performs for the portal case by serving the
  Storybook build. The story file exists for it; the assertion does not yet. (Deliberately not
  written here as a path: `check-verification` resolves a cited path as EVIDENCE, and naming a file
  where the assertion is absent would claim the opposite of what this gap says.) This is the most likely thing here to be wrong and unnoticed, and it is a gap in the GATE's
  reach rather than an oversight in this component.
- **Scroll lock is asserted as a MECHANISM, not as an absence of shift.** jsdom computes no layout,
  so the test observes that the page is locked and that the scrollbar's width is handed back as
  padding. Whether the page actually holds still is gate 7's.
- **Screen reader testing is not automated.** PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7, US-01M0WSME).
