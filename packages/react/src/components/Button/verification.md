# Button - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from the
tests that actually run, so it can be checked rather than believed.

**Boundary:** client-only (see `client-boundary.json`).

## Keyboard

Enter and Space activate; a disabled button keeps its tab stop (D0028) and does not activate; loading sets aria-busy and preserves width; `as="a"` renders a link that does not navigate while disabled.


| Key | Result |
| --- | --- |
| Tab | One stop. A disabled button KEEPS its stop (D0028/D0058). |
| Enter / Space | Activates. |
| Enter / Space, when disabled | No-op - `aria-disabled` does not stop activation, so the handler suppresses it. |
| Enter, as `as="a"` and disabled | Does not navigate; default is prevented. |

## Recorded manual keyboard pass

Walked by hand on 2026-08-23, macOS 15, Safari 18 and Chrome 128, keyboard only. Every row of the
table above was exercised in both themes and both densities. Result: as documented.

This is a point-in-time record, not a gate. It is re-walked when the keyboard table changes.

## Accessibility

Focus indicator is the two-part ring (D0054), which survives every emphasis surface. Disabled text is NOT contrast-exempt - Clara exceeds WCAG here deliberately.

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
