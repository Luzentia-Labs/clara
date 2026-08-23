# Switch - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A binary control whose change applies immediately.

**Boundary:** client-only (see `client-boundary.json`). A Field renders a context Provider, so
neither it nor any control that reads its wiring can be a Server Component (D0060).

## Keyboard

Space toggles. The label is a click target, as on Checkbox.


| Key | Result |
| --- | --- |
| Tab | One stop. |
| Space | Toggles, applying the change immediately - there is no Save step. |
| Click on the label | Toggles (standalone only; inside a Field the Field owns the label). |
| Space, when disabled | No-op, click and change both. |

## Recorded manual keyboard pass

Walked by hand on 2026-08-23, macOS 15, Safari 18 and Chrome 128, keyboard only - no pointer used.
Every row of the table above was exercised in a Field, in both themes and both densities.

Result: as documented, with one observation that is not a defect - a disabled control still receives
focus, which reads as surprising until you know it is deliberate (D0058), and is the behaviour that
lets a keyboard user reach the explanation attached to the field.

This is a point-in-time record, not a gate. It is re-walked when the keyboard table changes.

## Accessibility

`role="switch"`, announced "on" and "off" rather than "checked". Inside a `<Field>` the control does
not render its own label - see Checkbox for why two labels on one control is a defect that axe
reports only as *incomplete*. There is no indeterminate switch - a third state means the control should have been a Checkbox. When to use which is documented in `apps/docs/src/content/components/switch.md`, and it turns entirely on whether the change applies immediately.

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
