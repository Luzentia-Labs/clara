# NumberInput - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A numeric entry control for quantities, amounts and codes.

**Boundary:** client-only (see `client-boundary.json`). A Field renders a context Provider, so
neither it nor any control that reads its wiring can be a Server Component (D0060).

## Keyboard

Arrow Up and Down step by `step`; PageUp and PageDown by ten steps; Home and End jump to the bounds.
All of them clamp, and all go through the native value setter so React's own `onChange` fires and a
controlled component stays in sync. The full key set travels with the spinbutton role, because a
control that announces bounds and offers no way to reach them is half a contract. Steps are rounded
to the precision `step` implies, so a 0.1 step does not write `0.30000000000000004` into a currency
field.


| Key | Result |
| --- | --- |
| Arrow Up / Arrow Down | Steps by `step`, clamped to `min` and `max`. |
| PageUp / PageDown | Steps by ten times `step`, clamped. |
| Home / End | Jumps to `min` / `max`. No-ops when that bound is not set. |
| Any of the above, when disabled | No-op. `readOnly` stops typing but not the component's own writes, so this is suppressed explicitly. |
| Wheel | Not a key, but recorded here because it is the notorious one: it cannot change the value, because the control is never `type="number"`. |

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

Supplying `min`, `max` **or** `step` makes the control a **spinbutton**, which is the only role that supports
`aria-valuemin` / `aria-valuemax` / `aria-valuenow`. An earlier version emitted those properties on
the implicit `textbox` role, where they are invalid: nothing announced them, and axe reported it as
a critical `aria-allowed-attr` violation while this record claimed the bounds were announced. The
axe fixture did not catch it because it rendered the control WITHOUT bounds - the one configuration
that cannot fail. With none of the three the control stays a plain textbox - and it neither steps
nor swallows the arrow keys, which is correct: an account code is not a value in a range, and
`00417` must survive Arrow Up with the caret still moving.

The wheel cannot change the value because the control is never `type="number"` - that is structural,
not a handler. An earlier version blurred the control on wheel, which protected against nothing and
stole focus from anyone scrolling a long form.

Figures are tabular, so a column of amounts aligns, and a leading zero is preserved.

## What is verified automatically

- axe (serious and critical) in all four theme x density combinations - `check:axe`
- The behaviour above, in `../Field/__tests__/behaviour.test.tsx`
- Token-only styling, no literals and no tier 1 reads - `check:component-css`
- Colour pairings measured against the palette, both themes - `check:contrast`

## Stated gaps

- **An out-of-range value inside a VALID Field announces invalid with no message.** The control sets
  `aria-invalid` so it does not announce `aria-valuenow="500"` beside `aria-valuemax="10"` as though
  both were fine - but when the Field carries no error there is no text to point
  `aria-errormessage` at. A plausible WCAG 2.2 SC 3.3.1 shortfall, invisible to axe, and a UX call
  (the alternative is announcing the contradiction). Raised by a spec review; not yet decided.

- **Screen reader testing is not automated.** axe checks the accessibility tree, not what NVDA or
  VoiceOver actually announce. PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7), so the rendered appearance is unverified - only
  the markup, the tokens and the measured contrast are.
