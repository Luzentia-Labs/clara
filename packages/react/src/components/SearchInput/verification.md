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

Walked by hand on 2026-08-23, macOS 15, Safari 18 and Chrome 128, keyboard only - no pointer used.
Every row of the table above was exercised in a Field, in both themes and both densities.

Result: as documented, with one observation that is not a defect - a disabled control still receives
focus, which reads as surprising until you know it is deliberate (D0058), and is the behaviour that
lets a keyboard user reach the explanation attached to the field.

This is a point-in-time record, not a gate. It is re-walked when the keyboard table changes.

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
