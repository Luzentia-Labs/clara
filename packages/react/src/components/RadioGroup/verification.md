# RadioGroup - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A fieldset of mutually exclusive options - one answer to one question.

**Boundary:** client-only (see `client-boundary.json`). A Field renders a context Provider, so
neither it nor any control that reads its wiring can be a Server Component (D0060).

## Keyboard

One tab stop for the whole group, with arrow keys moving and choosing. That is the browser's own behaviour for same-named radios, not a roving `tabindex` implementation, so it stays correct in every browser without Clara maintaining it.

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
