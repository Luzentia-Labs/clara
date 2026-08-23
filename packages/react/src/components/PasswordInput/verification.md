# PasswordInput - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A masked text control with a reveal toggle.

**Boundary:** client-only (see `client-boundary.json`). A Field renders a context Provider, so
neither it nor any control that reads its wiring can be a Server Component (D0060).

## Keyboard

The toggle is a real button in the tab order, operable with Enter and Space. Revealing does not move focus out of the field.

## Accessibility

The toggle's accessible name states the action it will perform - "Show password", then "Hide password" - not the state it is in. A name that reports state is read at the wrong moment and tells the user the opposite of what pressing it does.

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
