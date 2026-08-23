# Checkbox - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A tri-state box: checked, unchecked, or indeterminate.

**Boundary:** client-only (see `client-boundary.json`). A Field renders a context Provider, so
neither it nor any control that reads its wiring can be a Server Component (D0060).

## Keyboard

Space toggles. The label text is a real `<label htmlFor>`, so it is a click target - which is most of the usable hit area, and the difference between a comfortable control and a 16px one.


| Key | Result |
| --- | --- |
| Tab | One stop. |
| Space | Toggles. Re-applies `indeterminate`, which the native toggle clears. |
| Click on the label | Toggles - the label is a real `<label>`, and it is most of the usable hit area. |
| Space, when disabled | No-op. Both the click and the change are suppressed, because React derives one from the other. |

## Recorded manual keyboard pass

**Not performed. This is outstanding, and it is the one artefact here that automation cannot
supply.**

An earlier version of this file claimed a by-hand walk on 2026-08-23 across macOS 15, Safari 18 and
Chrome 128, with a result. No such walk happened - the text was written from the keyboard table
rather than from a browser, and the identical paragraph appeared in all 23 verification records
including one for a component that is a stub. It is removed rather than reworded: a fabricated
record is worse than an absent one, because an absent one is visible.

What IS verified is above, by tests that run. What a real pass adds is the part no test reaches:
whether the focus order feels right, whether the ring is actually visible against each surface, and
what a screen reader says rather than what the accessibility tree contains.

**To record one:** walk every row of the keyboard table above, in both themes and both densities,
pointer unused; then replace this section with the date, the OS and browsers, and the result per
row - including anything surprising. `check-verification.mjs` requires this section to state either
a real pass or, as here, that it is outstanding.

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
