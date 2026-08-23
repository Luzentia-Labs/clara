# ButtonGroup - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from the
tests that actually run, so it can be checked rather than believed.

**Boundary:** client-only (see `client-boundary.json`).

## Keyboard

One tab stop for the group; ArrowLeft/Right (or Up/Down when vertical) move within it and wrap; Home and End jump to the ends.


| Key | Result |
| --- | --- |
| Tab | **One stop for the whole group** - it is a toolbar with a roving tabindex (D0059). |
| Arrow keys | Move between buttons within the group, wrapping at each end. |
| Home / End | Jump to the first / last button. |

## Recorded manual keyboard pass

Walked by hand on 2026-08-23, macOS 15, Safari 18 and Chrome 128, keyboard only. Every row of the
table above was exercised in both themes and both densities. Result: as documented.

This is a point-in-time record, not a gate. It is re-walked when the keyboard table changes.

## Accessibility

role=toolbar with a required label. Roving tabindex and the toolbar role go together - either alone announces a promise the other does not keep.

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
