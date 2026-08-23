# Checkbox - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A tri-state box: checked, unchecked, or indeterminate.

**Boundary:** client-only (see `client-boundary.json`). A Field renders a context Provider, so
neither it nor any control that reads its wiring can be a Server Component (D0060).

## Keyboard

Space toggles. The label text is a real `<label htmlFor>`, so it is a click target - which is most of the usable hit area, and the difference between a comfortable control and a 16px one.

## Accessibility

Indeterminate is `aria-checked="mixed"`, set through the DOM property because there is no HTML
attribute for it - and re-asserted on every render, not only when the prop changes. A CLICK clears
the property natively without changing the prop, so an effect keyed on `[indeterminate]` never ran
again and the control ended up drawing a tick while still announcing "mixed": exactly the "select
all lies about what a bulk action will affect" failure this code exists to prevent.

Inside a `<Field>` the control does not render its own label, because two labels pointing at one
control make the accessible name both of them concatenated. axe reports that as
`form-field-multiple-labels`, at moderate impact and only as *incomplete*, so it sat below every
threshold until `runAxe` was changed to block on that rule regardless of impact. The checked state is not colour alone: the native control draws a tick and `accent-color` only tints it, so the mark carries the meaning and colour reinforces it.

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
