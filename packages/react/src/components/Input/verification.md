# Input - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A single-line text control that fills its Field, with readonly and disabled as visibly distinct states.

**Boundary:** client-only (see `client-boundary.json`). A Field renders a context Provider, so
neither it nor any control that reads its wiring can be a Server Component (D0060).

## Keyboard

Readonly stays in the tab order and is selectable and copyable; disabled is removed from it. Those are different states and they do not look alike.

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
