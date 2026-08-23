# RadioGroup - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A fieldset of mutually exclusive options - one answer to one question.

**Boundary:** client-only (see `client-boundary.json`). A Field renders a context Provider, so
neither it nor any control that reads its wiring can be a Server Component (D0060).

## Keyboard

One tab stop for the whole group, with arrow keys moving and choosing. That is the browser's own behaviour for same-named radios, not a roving `tabindex` implementation, so it stays correct in every browser without Clara maintaining it.


| Key | Result |
| --- | --- |
| Tab | **One stop for the whole group**, landing on the checked option, or the first if none is checked. |
| Arrow keys | Move between options AND select - the browser's own behaviour for same-named radios. |
| Space | Selects the focused option. |
| Arrow keys, when disabled | Move focus but do not change the selection. |

## Recorded manual keyboard pass

Walked by hand on 2026-08-23, macOS 15, Safari 18 and Chrome 128, keyboard only - no pointer used.
Every row of the table above was exercised in a Field, in both themes and both densities.

Result: as documented, with one observation that is not a defect - a disabled control still receives
focus, which reads as surprising until you know it is deliberate (D0058), and is the behaviour that
lets a keyboard user reach the explanation attached to the field.

This is a point-in-time record, not a gate. It is re-walked when the keyboard table changes.

## Accessibility

The role is `radiogroup` rather than the bare fieldset's implicit `group`, because that is the role
which supports `aria-required` - putting it on a plain group is invalid ARIA and axe reports it as
critical. Inside a `<Field labelFor="group">` the Field's label names the group through
`aria-labelledby`; `htmlFor` cannot target a fieldset.

The error belongs to the QUESTION, so `aria-invalid` and `aria-errormessage` sit on the fieldset, not on an individual radio - marking every option invalid says each answer is wrong, when what is wrong is that none was chosen. No bare `Radio` is exported: a lone radio is a control the user cannot deselect, and shipping one invites it.

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
