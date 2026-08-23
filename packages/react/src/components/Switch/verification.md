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
