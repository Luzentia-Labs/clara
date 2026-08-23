# Input - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A single-line text control that fills its Field, with readonly and disabled as visibly distinct states.

**Boundary:** client-only (see `client-boundary.json`). A Field renders a context Provider, so
neither it nor any control that reads its wiring can be a Server Component (D0060).

## Keyboard

Readonly stays in the tab order and is selectable and copyable. **So does disabled** - it is
`aria-disabled` plus `readOnly`, never the native attribute (D0058), because a natively disabled
control is unreachable and the reason it is disabled is usually attached to it. The two are still
different states and do not look alike: disabled takes the disabled background and foreground,
readonly keeps the surface and changes only the text colour.


| Key | Result |
| --- | --- |
| Tab | Enters and leaves the field. |
| Any printing key | Types, unless readonly or disabled. |
| Tab, when readonly | Still reaches it; the value stays selectable and copyable. |
| Tab, with `clearable` and a value | Reaches the clear button after the field. It is absent when the field is empty, so there is no dead stop. |
| Enter / Space on clear | Clears and returns focus to the input. No-op when the Field is disabled. |

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

Readonly text keeps full contrast. WCAG exempts disabled text from the contrast minimum; Clara does
not take that exemption for readonly, because readonly text exists to be read.

Disabled is `aria-disabled` plus `readOnly`, never the native `disabled` attribute (D0058, D0028).
A natively disabled control leaves the tab order, so a keyboard user can never reach it - and an ERP
form is frequently mostly disabled, with the REASON attached to the control they cannot reach. The
first version of this framework used the native attribute, contradicting a decision accepted one
epic earlier and already shipped in Button, and two tests asserted the violation as correct.

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
- **Autofill styling is checked manually** (AC4), in Chrome and Safari. The browsers apply their
  own background through a UA stylesheet that jsdom does not implement, so no unit test can see it.
