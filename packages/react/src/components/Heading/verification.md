# Heading - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A heading whose visual size is independent of its outline level.

**Boundary:** server-capable (see `../../../client-boundary.json`). No function props, no state,
no browser APIs, so it carries no `"use client"` directive and renders on the server.

## Keyboard

Not focusable. Headings are navigated with a screen reader's own heading commands, not with Tab.
## Accessibility

`level` sets the element (h1-h6) and `size` sets the appearance, deliberately separately. Tying them together forces the author to break either the document outline or the visual hierarchy, and the outline is the one that loses in practice - which is what makes heading navigation useless.

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
