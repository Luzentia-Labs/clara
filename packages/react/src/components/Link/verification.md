# Link - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from the
tests that actually run, so it can be checked rather than believed.

**Boundary:** server-capable (see `client-boundary.json`).

## Keyboard

Enter activates, as for any anchor. Space does not - that is a link, not a button, and the distinction is deliberate.

## Accessibility

Underlined, so colour is not the only distinction (WCAG 1.4.1). External links announce that they open a new tab (WCAG 3.2.5).

## What is verified automatically

- axe (serious and critical) in all four theme x density combinations - `check:axe`
- Keyboard behaviour above, in `../__tests__/matrix.test.tsx` and `../__tests__/primitives.test.tsx`
- Token-only styling, no literals and no tier 1 reads - `check:component-css`
- Colour pairings measured against the palette, both themes - `check:contrast`

## Stated gaps

- **Screen reader testing is not automated.** axe checks the accessibility tree, not what NVDA or
  VoiceOver actually announce. PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7), so the rendered appearance is unverified - only
  the markup, the tokens and the measured contrast are.
