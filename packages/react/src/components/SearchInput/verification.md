# SearchInput - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A text control for filtering, announced as a search field, with a keyboard-reachable clear.

**Boundary:** client-only (see `client-boundary.json`). A Field renders a context Provider, so
neither it nor any control that reads its wiring can be a Server Component (D0060).

## Keyboard

The clear button is in the tab order and **returns focus to the input** when pressed. A clear button that keeps focus strands a keyboard user on a control that has just been removed from the page.


| Key | Result |
| --- | --- |
| Tab | Reaches the field, then the clear button - which exists only when there is a value. |
| Enter / Space on clear | Clears the value and returns focus to the input, because the button is about to be removed from the page. |
| Escape | Not bound. The browser's own search-cancel affordance is suppressed, so nothing competes for it. |

## Recorded manual keyboard pass

**Not performed. This is outstanding, and it is the one artefact here that automation cannot
supply.**

An earlier version of this file claimed a by-hand walk on 2026-08-23 across macOS 15, Safari 18 and
Chrome 128, with a result. No such walk happened - the text was written from the keyboard table
rather than from a browser, and the identical paragraph appeared in all 23 verification records
including one for a component that is a stub. It is removed rather than reworded: a fabricated
record is worse than an absent one, because an absent one is visible.

What IS verified is above, by tests that run. What a real pass adds is the part no test reaches:
whether the focus order feels right, whether the ring is actually visible against each surface, and
what a screen reader says rather than what the accessibility tree contains.

**To record one:** walk every row of the keyboard table above, in both themes and both densities,
pointer unused; then replace this section with the date, the OS and browsers, and the result per
row - including anything surprising. `check-verification.mjs` requires this section to state either
a real pass or, as here, that it is outstanding.

## Accessibility

Announced as a searchbox. The clear button is rendered only when there IS a value - it was
previously rendered whenever `clearable`, so every empty search field carried a permanent "Clear
search" tab stop that did nothing, while the prop documentation and the docs page both said
otherwise. The browser's own search-cancel affordance is suppressed, which is what makes the claim
that the clear is Clara's own true: the native one is unstyled, absent in Firefox, and not keyboard
reachable in Safari.

Clara does not debounce - see `apps/docs/src/content/components/search-input.md` for why that is the caller's decision, and what to do in each case.

## What is verified automatically

- axe (serious and critical) in all four theme x density combinations - `check:axe`
- The behaviour above, in `../Field/__tests__/behaviour.test.tsx`
- Token-only styling, no literals and no tier 1 reads - `check:component-css`
- Colour pairings measured against the palette, both themes - `check:contrast`

## Stated gaps

- **Screen reader testing is not automated.** axe checks the accessibility tree, not what NVDA or
  VoiceOver actually announce. PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7), so the rendered appearance is unverified - only
  the markup, the tokens and the measured contrast are.
