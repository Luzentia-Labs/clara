# Modal - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A dialog that takes focus, keeps it, and gives it back.

**Boundary:** client-only (see `client-boundary.json`). It holds a focus trap, a scroll lock and an
effect that restores focus on close, so it cannot be a Server Component.

## Keyboard

Focus goes in on open and cannot leave until the dialog closes. Every dismissal route returns focus
to the element that opened it, asserted by element identity rather than by "something is focused".

| Key | Result |
| --- | --- |
| Tab | Moves to the next focusable element INSIDE the panel. From the last, wraps to the first. |
| Shift+Tab | The same in reverse. From the first, wraps to the last. |
| Escape | Closes and returns focus to the opener. Works from inside a text input. |
| Enter, in the footer's primary action | Commits, then returns focus to the opener like every other route. |
| Tab, into background content | Impossible - the background is unreachable, not merely trapped. |
| Click on the scrim | Closes, and returns focus to the opener. |
| Click inside the panel | Does not close. A drag starting inside and ending on the scrim does not close either. |

## Recorded manual keyboard pass

**Not performed. This is outstanding, and it is the one artefact here that automation cannot
supply.**

No by-hand walk has happened. Recorded as absent rather than described from the table above: a
fabricated record is worse than an absent one, because an absent one is visible. That is not
hypothetical in this repo - the identical paragraph was once written into all 23 records for a walk
nobody made.

What IS verified is below, by tests that run. What a real pass adds here is specific: whether focus
visibly lands where the test says it lands, whether the scrim reads as a scrim rather than as a
broken page, and what a screen reader announces on open - which is the one thing about a dialog that
users notice first and no test reaches.

**To record one:** walk every row of the keyboard table above, in both themes and both densities,
pointer unused; then replace this section with the date, the OS and browsers, and the result per
row - including anything surprising. `check-verification.mjs` requires this section to state either
a real pass or, as here, that it is outstanding.

## Accessibility

`role="dialog"` with `aria-modal`, named by its required `title` and described by its optional
`description`. `title` is a required prop rather than an optional one for the same reason
IconButton's `label` is: an unnamed dialog is announced as "dialog" and nothing more, and making the
omission a compile error is cheaper than an audit finding.

The background is **unreachable**, not merely Tab-trapped - but the mechanism is `aria-hidden` on
the siblings plus a focus scope that pulls focus back, NOT the `inert` attribute. An earlier version
of this record said "marked inert", which named a mechanism Clara does not use; the distinction
matters because `inert` is what a reader would grep for and would not find.

The distinction between unreachable and trapped is still load-bearing and is asserted directly:
an implementation that keeps the Tab trap but drops the hiding still cycles focus correctly, so a
Tab-only test cannot see the regression. The test focuses a background element programmatically and
asserts focus does not land there.

Known limit: axe reports `aria-hidden-focus` as *incomplete* rather than as a violation, and the
harness drops incomplete results (D0032), so axe is not what catches a regression here - the
programmatic-focus assertion is.

There is no motion (D0094), and consequently no `prefers-reduced-motion` branch - there is nothing
to reduce. A centred dialog has no spatial origin, and its state change is already the least
ambiguous signal in the system.

## What is verified automatically

- The behaviour above, in `__tests__/behaviour.test.tsx` - 40 tests, including all four dismissal
  routes asserted separately, each asserting that focus LEFT the opener before it came back (two of
  them previously passed against an implementation that did nothing, because `userEvent.click`
  leaves focus on the button it clicked)
- axe (serious and critical) over the open dialog - `__tests__/behaviour.test.tsx`
- Token-only styling, no literals and no tier 1 reads - `check:component-css`
- The declarations that give the panel and its scrim a box - `check:component-css` SHAPE_CONTRACT -
  and the VALUES that make the BODY a scroll container, the panel a theme-resolving surface, and
  both surfaces share one layer with no offset - `check:component-css` VALUE_CONTRACT. The second is
  what actually proves AC5 and AC7: SHAPE_CONTRACT asserts a property is DECLARED, so
  `overflow-y: visible` satisfied it while turning the scrolling off, and every Modal test stayed
  green because jsdom computes no layout
- That the stylesheet declares no `transition` and no `animation` at all (D0094) -
  `check:component-css` NO_MOTION
- That the scrim's alpha still clears its three measured floors, re-derived from the token sources
  rather than trusted as prose - `check:foundations`
- That nothing focusable and no text sits on the scrim, which is a decision (D0092) rather than an
  omission - Clara's light focus ring measures 1.86:1 against the light scrim composite
- No Radix type, prop name or `data-*` attribute on the public surface - `check:api`
- Radix stays external and is not inlined into any chunk - `check:bundled-peers`
- Modal's own chunk is 1.89 kB gzipped against a 5 kB budget; the shared Radix runtime is 14.77 kB
  against an 18 kB ceiling, measured once rather than charged to each overlay - `pnpm size`

## Stated gaps

- **Screen reader testing is not automated.** axe checks the accessibility tree, not what NVDA or
  VoiceOver announce. PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7, US-01M0GMZW), so the rendered appearance is
  unverified - only the markup, the tokens and the measured contrast are. This is the component
  where that gap bites hardest: the scrim, the elevation reading and the centred panel are all
  visual claims.
- **Scroll lock is asserted by mechanism, not by outcome.** jsdom computes no layout, so no test
  here can observe a layout shift. What is asserted is that the page is locked and that the width
  the scrollbar occupied is handed back as padding, derived from a stubbed viewport rather than
  hardcoded. The outcome itself needs the manual pass or gate 7.
- **The scrim's chosen alpha is not pinned, only its floors are.** `check:foundations` rejects a
  scrim that loses the panel boundary, fails to dim, or makes the page unreadable. It does not
  reject the 0.40-0.45 band D0092 avoids for margin - at 0.42 the light panel cue is 3.03:1 and
  clears the floor. Moving the scrim within that band is a decision to revisit, not a build failure.
- **Nesting is asserted one level deep.** Modal-over-menu and menu-over-Modal are decided by DOM
  order (D0088) and the host ordering is asserted, but the composition with a real Select or
  DropdownMenu cannot be tested until those components exist (EP-01M0GK91).
