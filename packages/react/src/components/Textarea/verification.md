# Textarea - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A multi-line text control that can grow with its content, up to a cap.

**Boundary:** client-only (see `client-boundary.json`). A Field renders a context Provider, so
neither it nor any control that reads its wiring can be a Server Component (D0060).

## Keyboard

Enter inserts a newline; it does not submit. Tab leaves the control rather than indenting.

## Accessibility

Auto-resize is opt-in through `maxRows`, and the cap is the point of it: an unbounded textarea
pushes the submit button off the screen, so the user cannot see the action they are about to take.
Past the cap it scrolls. A controlled value that changes from outside - a form reset, a `setValue` -
re-measures too; it previously kept the height it had.

The cap is verified by standing in a content height, because jsdom computes no layout and
`scrollHeight` is always 0 there. Without that, both assertions were constants: `height` was always
`"0px"` (truthy, and read as "it grew") and overflow was always `hidden` under a test named "scrolls
past the bound".

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
