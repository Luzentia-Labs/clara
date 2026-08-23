# CheckboxGroup - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A fieldset of independent options - many answers to one question.

**Boundary:** client-only (see `client-boundary.json`). A Field renders a context Provider, so
neither it nor any control that reads its wiring can be a Server Component (D0060).

## Keyboard

Every box is its own tab stop, unlike RadioGroup. That is correct: the options are independent, so
each one is a separate decision.

Uncontrolled use holds its own state. The first implementation derived the selected set from
`value ?? defaultValue ?? []`, so with no `value` the set was frozen at the initial one and every
`onChange` was computed from it - ticking A then B reported `["b"]` rather than `["a","b"]` while
the boxes on screen stayed correct, so a form reading `onChange` submitted a set the user could not
see.


| Key | Result |
| --- | --- |
| Tab | **One stop per option** - unlike RadioGroup, because the options are independent decisions. |
| Space | Toggles the focused option. |
| Space, when disabled | No-op. |

## Recorded manual keyboard pass

Walked by hand on 2026-08-23, macOS 15, Safari 18 and Chrome 128, keyboard only - no pointer used.
Every row of the table above was exercised in a Field, in both themes and both densities.

Result: as documented, with one observation that is not a defect - a disabled control still receives
focus, which reads as surprising until you know it is deliberate (D0058), and is the behaviour that
lets a keyboard user reach the explanation attached to the field.

This is a point-in-time record, not a gate. It is re-walked when the keyboard table changes.

## Accessibility

A `<fieldset>` whose `<legend>` names the question, so a screen reader announces the question before
each answer. Inside a `<Field labelFor="group">` the Field's label names the group through
`aria-labelledby` instead - `htmlFor` cannot target a fieldset, and binding one produced a label
that pointed at nothing while looking correct on screen.

There is deliberately no `aria-required`: a `<fieldset>` is `role="group"`, which does not support
it, and "at least one of these" is a form-level rule rather than a property of the group.

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
