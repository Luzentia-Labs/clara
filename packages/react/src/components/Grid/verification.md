# Grid - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

Column layout on the token scale.

**Boundary:** server-capable (see `../../../client-boundary.json`). No function props, no state,
no browser APIs, so it carries no `"use client"` directive and renders on the server.

## Keyboard

Nothing here takes a tab stop or handles a key. A layout primitive that captured focus would be a
bug: it wraps content and must be transparent to the keyboard, leaving order to the DOM.

## Accessibility

Visual column order and DOM order stay the same: CSS Grid can reorder visually, and doing so leaves the reading and tab order disagreeing with what is on screen.

## What is verified automatically

- axe (serious and critical) in all four theme x density combinations - `check:axe`
- The behaviour above, in `../__tests__/primitives.test.tsx` and `../__tests__/matrix.test.tsx`
- Token-only styling, no literals and no tier 1 reads - `check:component-css`
- Colour pairings measured against the palette, both themes - `check:contrast`

## Stated gaps

- **Screen reader testing is not automated.** axe checks the accessibility tree, not what NVDA or
  VoiceOver actually announce. PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7), so the rendered appearance is unverified - only
  the markup, the tokens and the measured contrast are.
