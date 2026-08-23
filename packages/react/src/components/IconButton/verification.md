# IconButton - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from the
tests that actually run, so it can be checked rather than believed.

**Boundary:** client-only (see `client-boundary.json`).

## Keyboard

Activation as Button. `label` is a REQUIRED prop, so an unnamed icon button is a compile error rather than an audit finding.


| Key | Result |
| --- | --- |
| Tab | One stop. |
| Enter / Space | Activates. The accessible name comes from the required `label`, never from the icon. |

## Recorded manual keyboard pass

Walked by hand on 2026-08-23, macOS 15, Safari 18 and Chrome 128, keyboard only. Every row of the
table above was exercised in both themes and both densities. Result: as documented.

This is a point-in-time record, not a gate. It is re-walked when the keyboard table changes.

## Accessibility

The icon is aria-hidden; the label is the accessible name, so the control is announced once. Target floor holds at compact density (PRD:164).

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
